import { describe, expect, it } from 'vitest';
import {
  CHEST_GEM_COST,
  botLoadout,
  canStartMatch,
  consumeSkills,
  freeMatchesLeft,
  isChestReward,
  openChest,
  playerLoadout,
  recordMatchStart,
  tryUpgrade,
  unlockFullGame,
} from '../src/core/economy';
import { normalizeProfile } from '../src/core/profile';

const fresh = () => normalizeProfile({});

describe('free matches per day and paywall', () => {
  const day1 = '2026-10-22';
  const day2 = '2026-10-23';

  it('gives 3 bot battles and 2 face-to-face matches a day, then the paywall', () => {
    const p = fresh();
    for (let i = 0; i < 3; i++) {
      expect(canStartMatch(p, 'bot', day1)).toBe(true);
      recordMatchStart(p, 'bot', day1);
    }
    expect(canStartMatch(p, 'bot', day1)).toBe(false);
    for (let i = 0; i < 2; i++) {
      expect(canStartMatch(p, 'local', day1)).toBe(true);
      recordMatchStart(p, 'local', day1);
    }
    expect(canStartMatch(p, 'local', day1)).toBe(false);
  });

  it('refills the next day', () => {
    const p = fresh();
    for (let i = 0; i < 3; i++) recordMatchStart(p, 'bot', day1);
    expect(freeMatchesLeft(p, 'bot', day2)).toBe(3);
    expect(canStartMatch(p, 'bot', day2)).toBe(true);
  });

  it('online needs the Full Game, which unlocks everything', () => {
    const p = fresh();
    expect(canStartMatch(p, 'online', day1)).toBe(false);
    for (let i = 0; i < 3; i++) recordMatchStart(p, 'bot', day1);
    unlockFullGame(p);
    expect(canStartMatch(p, 'online', day1)).toBe(true);
    expect(canStartMatch(p, 'bot', day1)).toBe(true);
    expect(p.coins).toBe(1300);
  });
});

describe('armory upgrades', () => {
  it('charges coins, caps at level 5', () => {
    const p = normalizeProfile({ coins: 10_000 });
    for (let i = 0; i < 4; i++) expect(tryUpgrade(p, 'tank').ok).toBe(true);
    expect(p.levels.tank).toBe(5);
    expect(p.coins).toBe(10_000 - 150 - 350 - 700 - 1200);
    expect(tryUpgrade(p, 'tank')).toEqual({ ok: false, reason: 'max' });
  });

  it('refuses when broke', () => {
    const p = normalizeProfile({ coins: 100 });
    expect(tryUpgrade(p, 'bunker')).toEqual({ ok: false, reason: 'coins' });
    expect(p.levels.bunker).toBe(1);
  });
});

describe('supply chest', () => {
  it('costs gems and always pays out coins and skills', () => {
    const p = normalizeProfile({ gems: CHEST_GEM_COST });
    const reward = openChest(p, () => 0.5);
    expect(isChestReward(reward)).toBe(true);
    if (!isChestReward(reward)) return;
    expect(reward.coins).toBeGreaterThanOrEqual(200);
    expect(Object.values(reward.skills).reduce((a, b) => (a ?? 0) + (b ?? 0), 0)).toBeGreaterThanOrEqual(2);
    expect(openChest(p, () => 0.5)).toEqual({ ok: false, reason: 'gems' });
  });
});

describe('bots track your Armory level', () => {
  it('recruit = your level - 1, veteran = equal, general = +1, clamped to 1..5', () => {
    const levels = { tank: 3, mortar: 3, bomb: 3, rocket: 3, bunker: 3 };
    expect(botLoadout('recruit', levels).levels.tank).toBe(2);
    expect(botLoadout('veteran', levels).levels.tank).toBe(3);
    expect(botLoadout('general', levels).levels.tank).toBe(4);
    expect(botLoadout('recruit', { tank: 1, mortar: 1, bomb: 1, rocket: 1, bunker: 1 }).levels.tank).toBe(1);
    expect(botLoadout('general', { tank: 5, mortar: 5, bomb: 5, rocket: 5, bunker: 5 }).levels.tank).toBe(5);
  });
});

describe('skill inventory', () => {
  it('a match offers one use per owned skill and consumes only what was used', () => {
    const p = normalizeProfile({ skills: { hide: 2, boost: 0, radar: 1, shield: 1, foldpreview: 1 } });
    const loadout = playerLoadout(p);
    expect(loadout.skills).toEqual({ hide: 1, boost: 0, radar: 1, shield: 1, foldpreview: 1 });
    consumeSkills(p, loadout, { hide: 0, boost: 0, radar: 1, shield: 1, foldpreview: 0 });
    expect(p.skills).toEqual({ hide: 1, boost: 0, radar: 1, shield: 1, foldpreview: 0 });
  });
});
