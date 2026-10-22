# Fold Warfare: App Store submission guide

Fold Warfare is an iPhone Duo game. You place units on the inner screen. Then you fold the phone, and the battle plays on the outer screen. It also runs on regular iPhones, where a FOLD button replaces the physical fold.

The code side is finished. The steps below need your Apple Developer account and App Store Connect, so they can't be done from this repo.

---

## 1. Build the app

```bash
npm install
npm run build          # web game -> dist/
npx cap sync ios       # copies dist/ into the iOS project
open ios/App/App.xcodeproj
```

Xcode 27.1 or later is required. The iPhone Duo hinge API (`UIHingeInteraction`) needs the iOS 27.1 SDK.

## 2. Signing and identity (Xcode → App target → Signing & Capabilities)

| Setting | Value |
|---|---|
| Team | your Apple Developer team |
| Bundle Identifier | `com.krishanthasandaruwan.foldwarfare` |
| Version / Build | 1.0.0 / 1 (increase the build for every upload) |
| Capabilities | **Game Center** (already in `App/App.entitlements`) and **In-App Purchase** (add with + Capability) |
| Devices | iPhone only, portrait |

## 3. App Store Connect: create the app

1. Go to **Apps → + New App**: platform iOS, name **Fold Warfare**, bundle ID `com.krishanthasandaruwan.foldwarfare`, SKU `foldwarfare001`.
2. Set **Category** to Games → Strategy, with Games → Board as the secondary category if you want one.
3. Set the **Price** to Free. The app is free to download. Every day it includes 3 free battles against the computer and 2 free face-to-face matches. The one-time Full Game unlock removes the daily limit and adds online play.

## 4. In-app purchases (Monetization → In-App Purchases)

Create these exactly. The IDs are hard-coded in `src/platform/purchases.ts`.

| Product ID | Type | Price | Name |
|---|---|---|---|
| `com.foldwarfare.game.unlock` | Non-Consumable | $4.99 | Full Game Unlock |
| `com.foldwarfare.game.coins.small` | Consumable | $0.99 | Coin Pouch (500) |
| `com.foldwarfare.game.coins.medium` | Consumable | $1.99 | Coin Crate (1200) |
| `com.foldwarfare.game.coins.large` | Consumable | $4.99 | Coin Vault (3500) |
| `com.foldwarfare.game.gems.small` | Consumable | $0.99 | Gem Handful (50) |
| `com.foldwarfare.game.gems.medium` | Consumable | $1.99 | Gem Sack (130) |
| `com.foldwarfare.game.gems.large` | Consumable | $4.99 | Gem Chest (380) |

Each product needs a display name, a description, a review screenshot of the in-game Store, and a review note. When you submit version 1.0, attach all 7 products to it.

To test locally, use `ios/App/Products.storekit`. The shared **App** scheme already points to it, so purchases work in the simulator with no App Store Connect setup. If Xcode doesn't pick it up, set it in **Product → Scheme → Edit Scheme → Run → Options → StoreKit Configuration**.

## 5. Game Center (Services → Game Center)

Turn on Game Center for the app, then create the following. The IDs are hard-coded in `src/platform/gamecenter.ts`.

**Leaderboard**

| ID | Type | Score | Sort |
|---|---|---|---|
| `foldwarfare.trophies` | Classic, best score | Integer | High to low |

**Achievements**

| ID | Name | Points | Description |
|---|---|---|---|
| `foldwarfare.first_win` | First Victory | 10 | Win your first battle |
| `foldwarfare.three_stars` | Total Destruction | 20 | Win a battle with 3 stars |
| `foldwarfare.gold_league` | Gold Commander | 30 | Reach Gold league |
| `foldwarfare.legend_league` | Legend | 50 | Reach Legend league |
| `foldwarfare.max_upgrade` | Fully Armed | 30 | Upgrade a unit to level 5 |
| `foldwarfare.online_win` | Online Victor | 20 | Win an online match |

Online matches use **turn-based** Game Center matches (`GKTurnBasedMatch`, 2 players). This needs no extra setup beyond enabling Game Center.

## 6. App Privacy (App Store Connect → App Privacy)

These answers match `ios/App/App/PrivacyInfo.xcprivacy` and the privacy policy.

- **Data collection:** Yes, for **Gameplay Content** only (online match moves sent through Game Center). It is not linked to identity, not used for tracking, and used for App Functionality.
- **Tracking:** No.
- Game Center identity (alias and player ID) is handled by Apple and does not need declaring as your own collection.
- **No** contact info, location, identifiers, usage data, diagnostics or purchase history is collected by the developer.

**Privacy Policy URL** (required): host `public/privacy.html` (it's also in `dist/privacy.html`) on any public web page, for example GitHub Pages or your website. Before publishing, fill in `src/content/privacy.json` → `placeholders` (developer/studio name and support email), then run `npm run privacy` to rebuild `docs/Privacy_Policy.docx` and `public/privacy.html`. The game also shows the policy in **Settings → Privacy Policy**.

## 7. Age rating

Answer the questionnaire as follows:

- Cartoon or fantasy violence: **Infrequent/Mild**. Tanks and explosions, no blood, no people harmed.
- Everything else: **None**.
- In-app purchases: **Yes**.
- User-generated content / unrestricted web access: **No**. Game Center nicknames are moderated by Apple.

The expected rating is **9+**.

## 8. Store listing

- **Subtitle (30 characters):** `Fold your phone. Start the war.`
- **Promotional text:** `Built for iPhone Duo: place your army on the big screen, fold, and watch the battle explode on the cover display.`
- **Keywords:** `tactics,strategy,tank,fold,duo,war,battle,artillery,bunker,turn based,pvp,multiplayer`
- **Description:**

  > Fold Warfare is a tactical battle game made for iPhone Duo.
  >
  > Open your phone and deploy tanks, mortars, rockets and hidden mines on your half of the battlefield. Aim by eye: there's no grid. When you fold the phone, both halves meet, and whatever lands on top of an enemy crashes into it. The higher level wins, and equal levels destroy each other. Then the artillery opens fire on the outer screen.
  >
  > • Battle the AI across leagues from Bronze to Legend
  > • Online turn-based matches through Game Center
  > • Face-to-face 2-player on one phone
  > • Upgrade your army, earn trophies, climb the global leaderboard
  > • Works on every iPhone; folding is the real thing on iPhone Duo

- **Support URL:** your website or a simple contact page (required).
- **Copyright:** `2026 <your name / studio>`.

## 9. Screenshots

App Store Connect asks for 6.9" iPhone screenshots (1320 × 2868 or 1290 × 2796). Add iPhone Duo screenshots too if App Store Connect lists a Duo size. Take them in the simulator with **File → Save Screen** or `xcrun simctl io booted screenshot shot.png`.

Suggested order:

1. Menu
2. Placement (inner screen)
3. "Fold your iPhone Duo" prompt
4. Battle crash
5. Victory with stars
6. Store / Armory

## 10. App Review notes (paste into "Notes" under App Review Information)

> Fold Warfare is designed for iPhone Duo. During a battle, after both players finish placing units, fold the phone: the battle plays on the outer display (detected with UIHingeInteraction). On other iPhones, or if you prefer, tap the FOLD button.
> To test without folding: Menu → BATTLE → place a bunker and units → FOLD.
> Free players get 3 battles against the computer and 2 face-to-face matches per day, refilled daily. Online play and unlimited matches need the Full Game Unlock (com.foldwarfare.game.unlock), offered on the paywall. Restore Purchases is in Settings and on the paywall.
> Online play uses Game Center turn-based matches and needs two Game Center accounts.
> No account or login is required to play.

## 11. Upload

1. In Xcode, select **Any iOS Device (arm64)**, then **Product → Archive**.
2. In Organizer, choose **Distribute App → App Store Connect → Upload**.
3. In App Store Connect, open TestFlight and test on an iPhone Duo: check fold detection, sign in to Game Center, and make a sandbox purchase.
4. Select the build on version 1.0, attach the IAPs, and click **Submit for Review**.

## What's already done in the project

- App icon (1024, opaque) and splash: `ios/App/App/Assets.xcassets`.
- Portrait only, iPhone only, status bar hidden, full screen.
- `ITSAppUsesNonExemptEncryption = false`, so there are no export-compliance questions.
- Photo library usage text (used for the optional profile photo).
- `PrivacyInfo.xcprivacy` privacy manifest.
- Game Center entitlement.
- StoreKit 2 purchase, transaction verification, `Transaction.updates` listener and Restore Purchases.
- Game Center sign-in, leaderboard, achievements and turn-based online matches.
- iPhone Duo hinge detection (`UIHingeInteraction`), with outer-screen and viewport fallback and a manual FOLD button.
- Fonts bundled offline (OFL, see `public/fonts/LICENSES.txt`).
- Privacy policy, in game and as `docs/Privacy_Policy.docx` / `public/privacy.html`.
