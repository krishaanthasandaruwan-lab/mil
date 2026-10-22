import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';

/** Shape of a Game Center turn-based match as reported by the native bridge. */
export type GcMatch = {
  matchId: string;
  /** GKTurnBasedMatch.Status: 0 unknown, 1 open, 2 ended, 3 matching. */
  status: number;
  /** Base64 game state. */
  data: string;
  isMyTurn: boolean;
  /** 0 = first participant (plays as P1), 1 = second (P2). */
  localIndex: number;
  participants: { playerId: string; alias: string; status: number; outcome: number }[];
};

export type GcPlayer = { authenticated: boolean; playerId?: string; alias?: string; error?: string };

export type PurchaseResult = { status: 'purchased' | 'cancelled' | 'pending' | 'unknown'; productId?: string; transactionId?: string };

export type StoreProduct = { id: string; displayName: string; description: string; displayPrice: string };

/** iPhone Duo hinge state from UIHingeInteraction (iOS 27.1+). `available` is false off-device or on the outer display. */
export type HingeInfo = { available: boolean; status: 'closed' | 'partiallyOpen' | 'fullyOpen' | 'unknown'; angle: number };

interface FoldNativePlugin {
  authenticate(): Promise<GcPlayer>;
  submitScore(options: { leaderboardId: string; score: number }): Promise<void>;
  showLeaderboard(options: { leaderboardId?: string }): Promise<void>;
  reportAchievement(options: { achievementId: string; percent?: number }): Promise<void>;
  findMatch(options: { inviteMessage?: string }): Promise<{ match?: GcMatch; cancelled?: boolean }>;
  loadMatches(): Promise<{ matches: GcMatch[] }>;
  loadMatch(options: { matchId: string }): Promise<{ match: GcMatch }>;
  endTurn(options: { matchId: string; data: string }): Promise<{ match: GcMatch }>;
  endMatch(options: { matchId: string; data: string; result: 'won' | 'lost' | 'tied' }): Promise<{ match: GcMatch }>;
  quitMatch(options: { matchId: string }): Promise<void>;
  getProducts(options: { productIds: string[] }): Promise<{ products: StoreProduct[] }>;
  purchase(options: { productId: string }): Promise<PurchaseResult>;
  restorePurchases(): Promise<{ productIds: string[] }>;
  getHinge(): Promise<HingeInfo>;
  addListener(event: 'turnEvent', fn: (e: { match: GcMatch; didBecomeActive: boolean }) => void): Promise<PluginListenerHandle>;
  addListener(event: 'matchEnded', fn: (e: { match: GcMatch }) => void): Promise<PluginListenerHandle>;
  addListener(event: 'purchaseUpdated', fn: (e: { productId: string; transactionId: string }) => void): Promise<PluginListenerHandle>;
  addListener(event: 'hinge', fn: (e: HingeInfo) => void): Promise<PluginListenerHandle>;
}

export const FoldNative = registerPlugin<FoldNativePlugin>('FoldNative');

/** True inside the iOS app (Game Center + App Store available); false in the browser build. */
export const isNativeIOS = (): boolean => Capacitor.getPlatform() === 'ios';
