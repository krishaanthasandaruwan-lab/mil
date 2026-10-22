import Foundation
import Capacitor
import GameKit
import StoreKit
import UIKit

/// Native services for Fold Warfare, exposed to the game as `FoldNative`:
/// - Game Center: sign-in, leaderboards, achievements and turn-based online matches
///   (each unit placement is one turn, which is exactly what GKTurnBasedMatch is built for).
/// - StoreKit 2: product info, purchases, restore and background transaction updates.
/// - iPhone Duo hinge: `UIHingeInteraction` (iOS 27.1+) reports closed / partially open / fully open, so the
///   game can start the battle on the outer screen the moment the phone is folded.
@objc(FoldNativePlugin)
public class FoldNativePlugin: CAPPlugin, CAPBridgedPlugin, GKGameCenterControllerDelegate,
    GKTurnBasedMatchmakerViewControllerDelegate, GKLocalPlayerListener {

    public let identifier = "FoldNativePlugin"
    public let jsName = "FoldNative"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "authenticate", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "submitScore", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "showLeaderboard", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "reportAchievement", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "findMatch", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "loadMatches", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "loadMatch", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "endTurn", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "endMatch", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "quitMatch", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getProducts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restorePurchases", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getHinge", returnType: CAPPluginReturnPromise)
    ]

    private var pendingMatchCall: CAPPluginCall?
    private var products: [String: Product] = [:]
    private var transactionUpdates: Task<Void, Never>?
    private var lastHinge: [String: Any] = ["available": false, "status": "unknown", "angle": 0]

    public override func load() {
        // Purchases approved later (Ask to Buy, interrupted payments) arrive here, not in purchase().
        transactionUpdates = Task { [weak self] in
            for await update in Transaction.updates {
                guard case .verified(let transaction) = update else { continue }
                await transaction.finish()
                self?.notifyListeners("purchaseUpdated", data: ["productId": transaction.productID, "transactionId": String(transaction.id)])
            }
        }
        DispatchQueue.main.async { [weak self] in self?.observeHinge() }
    }

    deinit {
        transactionUpdates?.cancel()
    }

    // MARK: - iPhone Duo hinge

    private func observeHinge() {
        guard #available(iOS 27.1, *), let view = bridge?.viewController?.view else { return }
        let interaction = UIHingeInteraction { [weak self] _, update in
            guard let self = self else { return }
            guard let hinge = update.hinge else {
                // Left a hierarchy that reports hinge state (e.g. the outer display); the game falls back to screen size.
                self.publishHinge(["available": false, "status": "unknown", "angle": 0])
                return
            }
            let status: String
            switch hinge.status {
            case .closed: status = "closed"
            case .partiallyOpen: status = "partiallyOpen"
            case .fullyOpen: status = "fullyOpen"
            default: status = "unknown"
            }
            self.publishHinge(["available": true, "status": status, "angle": Double(hinge.angle)])
        }
        view.addInteraction(interaction)
    }

    private func publishHinge(_ info: [String: Any]) {
        lastHinge = info
        notifyListeners("hinge", data: info, retainUntilConsumed: true)
    }

    @objc func getHinge(_ call: CAPPluginCall) {
        call.resolve(lastHinge)
    }

    // MARK: - Game Center: player

    @objc func authenticate(_ call: CAPPluginCall) {
        let local = GKLocalPlayer.local
        if local.isAuthenticated {
            local.register(self)
            call.resolve(playerInfo())
            return
        }
        var answered = false
        local.authenticateHandler = { [weak self] viewController, error in
            guard let self = self else { return }
            if let viewController = viewController {
                DispatchQueue.main.async { self.bridge?.viewController?.present(viewController, animated: true) }
                return
            }
            if local.isAuthenticated { local.register(self) }
            guard !answered else { return }
            answered = true
            var info = self.playerInfo()
            if let error = error, !local.isAuthenticated { info["error"] = error.localizedDescription }
            call.resolve(info)
        }
    }

    private func playerInfo() -> [String: Any] {
        let local = GKLocalPlayer.local
        return ["authenticated": local.isAuthenticated, "playerId": local.gamePlayerID, "alias": local.alias]
    }

    // MARK: - Game Center: leaderboards & achievements

    @objc func submitScore(_ call: CAPPluginCall) {
        guard let leaderboardId = call.getString("leaderboardId"), let score = call.getInt("score") else {
            call.reject("leaderboardId and score are required")
            return
        }
        GKLeaderboard.submitScore(score, context: 0, player: GKLocalPlayer.local, leaderboardIDs: [leaderboardId]) { error in
            if let error = error { call.reject(error.localizedDescription) } else { call.resolve() }
        }
    }

    @objc func showLeaderboard(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            let controller: GKGameCenterViewController
            if let leaderboardId = call.getString("leaderboardId") {
                controller = GKGameCenterViewController(leaderboardID: leaderboardId, playerScope: .global, timeScope: .allTime)
            } else {
                controller = GKGameCenterViewController(state: .leaderboards)
            }
            controller.gameCenterDelegate = self
            self.bridge?.viewController?.present(controller, animated: true)
            call.resolve()
        }
    }

    public func gameCenterViewControllerDidFinish(_ gameCenterViewController: GKGameCenterViewController) {
        gameCenterViewController.dismiss(animated: true)
    }

    @objc func reportAchievement(_ call: CAPPluginCall) {
        guard let achievementId = call.getString("achievementId") else {
            call.reject("achievementId is required")
            return
        }
        let achievement = GKAchievement(identifier: achievementId)
        achievement.percentComplete = call.getDouble("percent") ?? 100
        achievement.showsCompletionBanner = true
        GKAchievement.report([achievement]) { error in
            if let error = error { call.reject(error.localizedDescription) } else { call.resolve() }
        }
    }

    // MARK: - Game Center: turn-based matches

    @objc func findMatch(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            let request = GKMatchRequest()
            request.minPlayers = 2
            request.maxPlayers = 2
            request.inviteMessage = call.getString("inviteMessage") ?? "Join my Fold Warfare battle!"
            let controller = GKTurnBasedMatchmakerViewController(matchRequest: request)
            controller.turnBasedMatchmakerDelegate = self
            self.pendingMatchCall = call
            self.bridge?.viewController?.present(controller, animated: true)
        }
    }

    public func turnBasedMatchmakerViewControllerWasCancelled(_ viewController: GKTurnBasedMatchmakerViewController) {
        viewController.dismiss(animated: true)
        pendingMatchCall?.resolve(["cancelled": true])
        pendingMatchCall = nil
    }

    public func turnBasedMatchmakerViewController(_ viewController: GKTurnBasedMatchmakerViewController, didFailWithError error: Error) {
        viewController.dismiss(animated: true)
        pendingMatchCall?.reject(error.localizedDescription)
        pendingMatchCall = nil
    }

    /// Since iOS 14 a newly found or invited match arrives through this listener callback.
    public func player(_ player: GKPlayer, receivedTurnEventFor match: GKTurnBasedMatch, didBecomeActive: Bool) {
        let info = matchInfo(match)
        if let call = pendingMatchCall {
            pendingMatchCall = nil
            DispatchQueue.main.async { self.bridge?.viewController?.presentedViewController?.dismiss(animated: true) }
            call.resolve(["match": info])
            return
        }
        notifyListeners("turnEvent", data: ["match": info, "didBecomeActive": didBecomeActive])
    }

    public func player(_ player: GKPlayer, matchEnded match: GKTurnBasedMatch) {
        notifyListeners("matchEnded", data: ["match": matchInfo(match)])
    }

    @objc func loadMatches(_ call: CAPPluginCall) {
        GKTurnBasedMatch.loadMatches { matches, error in
            if let error = error {
                call.reject(error.localizedDescription)
                return
            }
            call.resolve(["matches": (matches ?? []).map { self.matchInfo($0) }])
        }
    }

    @objc func loadMatch(_ call: CAPPluginCall) {
        withMatch(call) { match in call.resolve(["match": self.matchInfo(match)]) }
    }

    @objc func endTurn(_ call: CAPPluginCall) {
        guard let data = decodeData(call) else { return }
        withMatch(call) { match in
            let others = match.participants.filter { $0.player?.gamePlayerID != GKLocalPlayer.local.gamePlayerID }
            match.endTurn(withNextParticipants: others, turnTimeout: GKTurnTimeoutDefault, match: data) { error in
                if let error = error { call.reject(error.localizedDescription) } else { call.resolve(["match": self.matchInfo(match)]) }
            }
        }
    }

    /// `result` is the local player's outcome: "won", "lost" or "tied"; the opponent gets the opposite.
    @objc func endMatch(_ call: CAPPluginCall) {
        guard let data = decodeData(call) else { return }
        let result = call.getString("result") ?? "tied"
        withMatch(call) { match in
            let me = GKLocalPlayer.local.gamePlayerID
            for participant in match.participants {
                let isMe = participant.player?.gamePlayerID == me
                switch result {
                case "won": participant.matchOutcome = isMe ? .won : .lost
                case "lost": participant.matchOutcome = isMe ? .lost : .won
                default: participant.matchOutcome = .tied
                }
            }
            match.endMatchInTurn(withMatch: data) { error in
                if let error = error { call.reject(error.localizedDescription) } else { call.resolve(["match": self.matchInfo(match)]) }
            }
        }
    }

    @objc func quitMatch(_ call: CAPPluginCall) {
        withMatch(call) { match in
            let me = GKLocalPlayer.local.gamePlayerID
            let done: (Error?) -> Void = { error in
                if let error = error { call.reject(error.localizedDescription) } else { call.resolve() }
            }
            if match.currentParticipant?.player?.gamePlayerID == me {
                let others = match.participants.filter { $0.player?.gamePlayerID != me }
                match.participantQuitInTurn(with: .quit, nextParticipants: others, turnTimeout: GKTurnTimeoutDefault, match: match.matchData ?? Data(), completionHandler: done)
            } else {
                match.participantQuitOutOfTurn(with: .quit, withCompletionHandler: done)
            }
        }
    }

    private func withMatch(_ call: CAPPluginCall, _ body: @escaping (GKTurnBasedMatch) -> Void) {
        guard let matchId = call.getString("matchId") else {
            call.reject("matchId is required")
            return
        }
        GKTurnBasedMatch.load(withID: matchId) { match, error in
            guard let match = match else {
                call.reject(error?.localizedDescription ?? "Match not found")
                return
            }
            body(match)
        }
    }

    private func decodeData(_ call: CAPPluginCall) -> Data? {
        guard let base64 = call.getString("data"), let data = Data(base64Encoded: base64) else {
            call.reject("data (base64) is required")
            return nil
        }
        return data
    }

    private func matchInfo(_ match: GKTurnBasedMatch) -> [String: Any] {
        let me = GKLocalPlayer.local.gamePlayerID
        let participants: [[String: Any]] = match.participants.map { participant in
            [
                "playerId": participant.player?.gamePlayerID ?? "",
                "alias": participant.player?.alias ?? "",
                "status": participant.status.rawValue,
                "outcome": participant.matchOutcome.rawValue
            ]
        }
        return [
            "matchId": match.matchID,
            "status": match.status.rawValue,
            "data": match.matchData?.base64EncodedString() ?? "",
            "isMyTurn": match.currentParticipant?.player?.gamePlayerID == me,
            "localIndex": match.participants.firstIndex { $0.player?.gamePlayerID == me } ?? -1,
            "participants": participants
        ]
    }

    // MARK: - StoreKit 2

    @objc func getProducts(_ call: CAPPluginCall) {
        let ids = call.getArray("productIds", String.self) ?? []
        Task {
            do {
                let list = try await Product.products(for: ids)
                list.forEach { self.products[$0.id] = $0 }
                call.resolve(["products": list.map { ["id": $0.id, "displayName": $0.displayName, "description": $0.description, "displayPrice": $0.displayPrice] }])
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    @objc func purchase(_ call: CAPPluginCall) {
        guard let productId = call.getString("productId") else {
            call.reject("productId is required")
            return
        }
        Task {
            do {
                var product = self.products[productId]
                if product == nil { product = try await Product.products(for: [productId]).first }
                guard let product = product else {
                    call.reject("Product \(productId) is not available")
                    return
                }
                switch try await product.purchase() {
                case .success(let verification):
                    guard case .verified(let transaction) = verification else {
                        call.reject("The purchase could not be verified")
                        return
                    }
                    await transaction.finish()
                    call.resolve(["status": "purchased", "productId": transaction.productID, "transactionId": String(transaction.id)])
                case .userCancelled:
                    call.resolve(["status": "cancelled"])
                case .pending:
                    call.resolve(["status": "pending"])
                @unknown default:
                    call.resolve(["status": "unknown"])
                }
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    /// Returns the non-consumables the player owns (e.g. the full-game unlock).
    @objc func restorePurchases(_ call: CAPPluginCall) {
        Task {
            try? await AppStore.sync()
            var owned: [String] = []
            for await result in Transaction.currentEntitlements {
                if case .verified(let transaction) = result, transaction.revocationDate == nil {
                    owned.append(transaction.productID)
                }
            }
            call.resolve(["productIds": owned])
        }
    }
}
