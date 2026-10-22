import { FoldNative, isNativeIOS, type GcPlayer } from './native';

/**
 * Game Center: online identity, the global trophy leaderboard and achievements.
 * IDs must match what you create in App Store Connect → Game Center (see docs/APP_STORE_SUBMISSION.md).
 */
export const GC_IDS = {
  trophiesLeaderboard: 'foldwarfare.trophies',
  achievements: {
    firstWin: 'foldwarfare.first_win',
    threeStars: 'foldwarfare.three_stars',
    goldLeague: 'foldwarfare.gold_league',
    legendLeague: 'foldwarfare.legend_league',
    maxUpgrade: 'foldwarfare.max_upgrade',
    onlineWin: 'foldwarfare.online_win',
  },
} as const;

let player: GcPlayer = { authenticated: false };

export const gcPlayer = (): GcPlayer => player;

/** Silent sign-in at launch; Game Center shows its own banner or login sheet when needed. */
export const signInToGameCenter = async (): Promise<GcPlayer> => {
  if (!isNativeIOS()) return player;
  try {
    player = await FoldNative.authenticate();
  } catch (err) {
    player = { authenticated: false, error: String(err) };
  }
  return player;
};

export const submitTrophies = async (trophies: number): Promise<void> => {
  if (!player.authenticated) return;
  await FoldNative.submitScore({ leaderboardId: GC_IDS.trophiesLeaderboard, score: trophies }).catch(() => undefined);
};

export const showGlobalLeaderboard = async (): Promise<boolean> => {
  if (!player.authenticated) return false;
  await FoldNative.showLeaderboard({ leaderboardId: GC_IDS.trophiesLeaderboard });
  return true;
};

export const unlockAchievement = async (achievementId: string): Promise<void> => {
  if (!player.authenticated) return;
  await FoldNative.reportAchievement({ achievementId }).catch(() => undefined);
};
