import type { BotDifficulty } from './ai';
import { MAX_LEVEL } from './balance';
import type { Loadout, MatchMode } from './match';
import { FREE_PER_DAY, type Profile, type UpgradeKey } from './profile';
import type { SkillType } from './types';

/**
 * Pure store/progression rules. Every function mutates the given profile and reports what happened;
 * screens decide how to show it and when to save. Real-money items are simulated until the
 * native store (Phase 3) is wired in.
 */

export type Spend = { ok: true } | { ok: false; reason: 'coins' | 'gems' | 'max' };

export const SKILLS: SkillType[] = ['hide', 'boost', 'radar', 'shield', 'foldpreview'];

/** Coins to go from level N to N+1 (index 0 = Lv1 -> Lv2). */
export const UPGRADE_COSTS = [150, 350, 700, 1200] as const;

export const upgradeCost = (level: number): number | undefined => (level >= MAX_LEVEL ? undefined : UPGRADE_COSTS[level - 1]);

export const tryUpgrade = (profile: Profile, key: UpgradeKey): Spend => {
  const cost = upgradeCost(profile.levels[key]);
  if (cost === undefined) return { ok: false, reason: 'max' };
  if (profile.coins < cost) return { ok: false, reason: 'coins' };
  profile.coins -= cost;
  profile.levels[key]++;
  return { ok: true };
};

export type MoneyPack = { id: string; image: string; title: string; price: string; coins: number; gems: number; tag?: string };

export const COIN_PACKS: MoneyPack[] = [
  { id: 'coins_s', image: 'store_coins_s', title: 'Pouch of Coins', price: '$0.99', coins: 500, gems: 0 },
  { id: 'coins_m', image: 'store_coins_m', title: 'Sack of Coins', price: '$1.99', coins: 1200, gems: 0, tag: 'POPULAR' },
  { id: 'coins_l', image: 'store_coins_l', title: 'Crate of Coins', price: '$4.99', coins: 3500, gems: 0, tag: 'BEST VALUE' },
];

export const GEM_PACKS: MoneyPack[] = [
  { id: 'gems_s', image: 'store_gems_s', title: 'Gem Pile', price: '$0.99', coins: 0, gems: 50 },
  { id: 'gems_m', image: 'store_gems_m', title: 'Gem Tray', price: '$1.99', coins: 0, gems: 130, tag: 'POPULAR' },
  { id: 'gems_l', image: 'store_gems_l', title: 'Gem Vault', price: '$4.99', coins: 0, gems: 380, tag: 'BEST VALUE' },
];

/** Simulated real-money purchase. */
export const buyPack = (profile: Profile, pack: MoneyPack): void => {
  profile.coins += pack.coins;
  profile.gems += pack.gems;
};

export type SkillOffer = { skill: SkillType; count: number; coins: number };

export const SKILL_OFFERS: SkillOffer[] = [
  { skill: 'hide', count: 3, coins: 150 },
  { skill: 'boost', count: 3, coins: 120 },
  { skill: 'radar', count: 3, coins: 180 },
  { skill: 'shield', count: 3, coins: 200 },
  { skill: 'foldpreview', count: 3, coins: 250 },
];

export const buySkill = (profile: Profile, offer: SkillOffer): Spend => {
  if (profile.coins < offer.coins) return { ok: false, reason: 'coins' };
  profile.coins -= offer.coins;
  profile.skills[offer.skill] += offer.count;
  return { ok: true };
};

export const CHEST_GEM_COST = 30;

export type ChestReward = { coins: number; gems: number; skills: Partial<Record<SkillType, number>> };

export const openChest = (profile: Profile, rng: () => number): ChestReward | Spend => {
  if (profile.gems < CHEST_GEM_COST) return { ok: false, reason: 'gems' };
  profile.gems -= CHEST_GEM_COST;
  const reward: ChestReward = { coins: 200 + Math.round(rng() * 40) * 10, gems: rng() < 0.2 ? 10 : 0, skills: {} };
  for (let i = 0; i < 2; i++) {
    const skill = SKILLS[Math.floor(rng() * SKILLS.length)] ?? 'boost';
    reward.skills[skill] = (reward.skills[skill] ?? 0) + 1 + Math.floor(rng() * 2);
  }
  profile.coins += reward.coins;
  profile.gems += reward.gems;
  Object.entries(reward.skills).forEach(([skill, n]) => {
    profile.skills[skill as SkillType] += n ?? 0;
  });
  return reward;
};

export const isChestReward = (r: ChestReward | Spend): r is ChestReward => 'coins' in r;

export const FULL_UNLOCK = { price: '$4.99', coins: 1000, gems: 50 } as const;

export const unlockFullGame = (profile: Profile): void => {
  if (profile.unlocked) return;
  profile.unlocked = true;
  profile.coins += FULL_UNLOCK.coins;
  profile.gems += FULL_UNLOCK.gems;
};

export type FreeMode = keyof typeof FREE_PER_DAY;

/** The player's local calendar day, so free matches refill at their midnight. */
export const today = (now: Date = new Date()): string =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

export const freeMatchesLeft = (profile: Profile, mode: FreeMode, day: string = today()): number =>
  Math.max(0, FREE_PER_DAY[mode] - (profile.daily.date === day ? profile.daily[mode] : 0));

/** Full Game: everything. Free: a few matches a day vs the bot and face to face; never online. */
export const canStartMatch = (profile: Profile, mode: MatchMode, day: string = today()): boolean =>
  profile.unlocked || (mode !== 'online' && freeMatchesLeft(profile, mode, day) > 0);

export const recordMatchStart = (profile: Profile, mode: MatchMode, day: string = today()): void => {
  if (profile.unlocked || mode === 'online') return;
  if (profile.daily.date !== day) profile.daily = { date: day, bot: 0, local: 0 };
  profile.daily[mode]++;
};

/** One use of each owned skill per match; levels come from the Armory. */
export const playerLoadout = (profile: Profile): Loadout => ({
  levels: { ...profile.levels },
  skills: Object.fromEntries(SKILLS.map((s) => [s, Math.min(1, profile.skills[s])])) as Record<SkillType, number>,
});

const BOT_LEVEL_OFFSET: Record<BotDifficulty, number> = { recruit: -1, veteran: 0, general: 1 };

/**
 * Bots track YOUR Armory: their level is your average unit level, shifted by difficulty. With level-based
 * crashes, a fixed bot level would make upgraded players unbeatable (or new players hopeless).
 */
export const botLoadout = (difficulty: BotDifficulty, playerLevels: Loadout['levels']): Loadout => {
  const values = Object.values(playerLevels);
  const average = Math.round(values.reduce((a, b) => a + b, 0) / Math.max(1, values.length));
  const level = Math.min(MAX_LEVEL, Math.max(1, average + BOT_LEVEL_OFFSET[difficulty]));
  return {
    levels: { tank: level, mortar: level, bomb: level, rocket: level, bunker: level },
    skills: { hide: 1, boost: 1, radar: 1, shield: 1, foldpreview: 0 },
  };
};

/** Removes the skills a player actually spent this match from their inventory. */
export const consumeSkills = (profile: Profile, loadout: Loadout, left: Record<SkillType, number>): void => {
  SKILLS.forEach((s) => {
    profile.skills[s] = Math.max(0, profile.skills[s] - Math.max(0, loadout.skills[s] - left[s]));
  });
};
