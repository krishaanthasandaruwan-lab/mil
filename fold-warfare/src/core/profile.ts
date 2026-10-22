import type { BotDifficulty } from './ai';
import type { SkillType, UnitType } from './types';

export type UpgradeKey = UnitType | 'bunker';

export type Profile = {
  name: string;
  trophies: number;
  coins: number;
  gems: number;
  wins: number;
  losses: number;
  muted: boolean;
  levels: Record<UpgradeKey, number>;
  skills: Record<SkillType, number>;
  /** Free matches used on `date` (local calendar day); refills every day. See FREE_PER_DAY. */
  daily: { date: string; bot: number; local: number };
  unlocked: boolean;
  /** Built-in portrait key, or 'photo' for a picture the player chose from their device. */
  avatar: string;
  bestTrophies: number;
  matches: number;
  threeStarWins: number;
  music: boolean;
  /** Weapon, crash and interface sounds ("All sound" is `muted`). */
  effects: boolean;
  /** Announcer voice lines. */
  voice: boolean;
  vibration: boolean;
};

export const MAX_NAME_LENGTH = 16;

/** Without the Full Game: free matches per day vs the bot and face to face. Online needs the Full Game. */
export const FREE_PER_DAY = { bot: 3, local: 2 } as const;

const STORAGE_KEY = 'fold-warfare/profile/v1';

const DEFAULT_PROFILE: Profile = {
  name: 'Commander',
  trophies: 100,
  coins: 300,
  gems: 20,
  wins: 0,
  losses: 0,
  muted: false,
  levels: { tank: 1, mortar: 1, bomb: 1, rocket: 1, bunker: 1 },
  skills: { hide: 3, boost: 3, radar: 2, shield: 2, foldpreview: 2 },
  daily: { date: '', bot: 0, local: 0 },
  unlocked: false,
  avatar: 'avatar_player',
  bestTrophies: 100,
  matches: 0,
  threeStarWins: 0,
  music: true,
  effects: true,
  voice: true,
  vibration: true,
};

export const LEAGUES = [
  { name: 'Bronze', min: 0, color: 0xcd7f32 },
  { name: 'Silver', min: 400, color: 0xc0c0c0 },
  { name: 'Gold', min: 800, color: 0xffd23f },
  { name: 'Crystal', min: 1200, color: 0xb388ff },
  { name: 'Master', min: 1600, color: 0x4dd0e1 },
  { name: 'Champion', min: 2000, color: 0xff7043 },
  { name: 'Legend', min: 2600, color: 0xff3d71 },
] as const;

export const leagueFor = (trophies: number): (typeof LEAGUES)[number] =>
  LEAGUES.reduce<(typeof LEAGUES)[number]>((current, league) => (trophies >= league.min ? league : current), LEAGUES[0]);

/** Older saves predate levels/skills/gems; nested objects are merged so new keys get defaults. */
export const normalizeProfile = (raw: Partial<Profile>): Profile => ({
  ...DEFAULT_PROFILE,
  ...raw,
  levels: { ...DEFAULT_PROFILE.levels, ...(raw.levels ?? {}) },
  skills: { ...DEFAULT_PROFILE.skills, ...(raw.skills ?? {}) },
  daily: { ...DEFAULT_PROFILE.daily, ...(raw.daily ?? {}) },
});

export const loadProfile = (): Profile => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return normalizeProfile(raw ? (JSON.parse(raw) as Partial<Profile>) : {});
  } catch {
    return normalizeProfile({});
  }
};

export const saveProfile = (profile: Profile): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Private mode or blocked storage: progress just won't persist this session.
  }
};

/** Read-modify-write helper so every screen changes the profile the same way. */
export const updateProfile = (change: (p: Profile) => void): Profile => {
  const profile = loadProfile();
  change(profile);
  saveProfile(profile);
  return profile;
};

/**
 * Design-doc formula: ΔTrophies = round(30 × (1 + (opponent − player) / 400)).
 * The factor is clamped so a huge upset can't swing more than 60, and losses mirror it.
 */
export const trophyDelta = (player: number, opponent: number, won: boolean): number => {
  const factor = Math.max(0.4, Math.min(2, 1 + (opponent - player) / 400));
  return won ? Math.round(30 * factor) : -Math.round(20 / factor);
};

export const coinReward = (won: boolean, stars: number): number => (won ? 100 : 30) + stars * 20;

/** Applies one finished bot battle to the profile: trophies, coins and career stats. */
export const recordBattle = (p: Profile, result: { won: boolean; draw: boolean; stars: number; trophyDelta: number; coins: number }): void => {
  p.trophies = Math.max(0, p.trophies + result.trophyDelta);
  p.bestTrophies = Math.max(p.bestTrophies, p.trophies);
  p.coins += result.coins;
  p.matches++;
  if (result.won) p.wins++;
  else if (!result.draw) p.losses++;
  if (result.won && result.stars === 3) p.threeStarWins++;
};

export const winRate = (p: Profile): number => (p.wins + p.losses === 0 ? 0 : Math.round((p.wins / (p.wins + p.losses)) * 100));

export const resetProgress = (): Profile => {
  const fresh = normalizeProfile({});
  saveProfile(fresh);
  return fresh;
};

export const botDifficultyFor = (trophies: number): BotDifficulty =>
  trophies < 300 ? 'recruit' : trophies < 900 ? 'veteran' : 'general';

const BOT_NAMES = ['General Viper', 'Captain Blitz', 'Major Kobra', 'Sgt. Boomer', 'Tanker Bruno', 'Colonel Mango', 'Lt. Fizz'];

export const rollOpponent = (playerTrophies: number): { name: string; trophies: number } => ({
  name: BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)] ?? 'General Viper',
  trophies: Math.max(0, playerTrophies + Math.floor(Math.random() * 160) - 60),
});
