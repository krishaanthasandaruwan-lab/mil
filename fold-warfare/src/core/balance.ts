import type { SkillType, UnitType } from './types';

/** Each half of the board, in field units (hinge-relative; both halves are the same size). */
export const FIELD = { width: 640, height: 440 } as const;

export type UnitStats = {
  name: string;
  hp: number;
  atk: number;
  /** Attack reach in field units, measured from this unit's centre to the edge of the target's body. */
  range: number;
  /** Footprint circle. Two bodies touching after the fold = a face-to-face clash. */
  bodyRadius: number;
  bunkerMultiplier: number;
  blurb: string;
};

export const UNITS: Record<UnitType, UnitStats> = {
  tank: {
    name: 'Tank',
    hp: 340,
    atk: 70,
    range: 105,
    bodyRadius: 24,
    bunkerMultiplier: 1.2,
    blurb: 'Heavy armor, short-range cannon. Tough in a crash.',
  },
  mortar: {
    name: 'Mortar',
    hp: 170,
    atk: 80,
    range: 175,
    bodyRadius: 18,
    bunkerMultiplier: 1,
    blurb: 'Lobs shells over long range. Fragile in a crash.',
  },
  bomb: {
    name: 'Mine',
    hp: 0,
    atk: 170,
    range: 0,
    bodyRadius: 17,
    bunkerMultiplier: 0,
    blurb: 'Crash trap: destroys an enemy that lands on it. The blast also hits your own units and bunker nearby.',
  },
  rocket: {
    name: 'Rocket',
    hp: 130,
    atk: 60,
    range: 240,
    bodyRadius: 23,
    bunkerMultiplier: 2.5,
    blurb: 'Long-range siege. Huge damage to bunkers, fragile up close.',
  },
};

export const BOOST_MULTIPLIER = 1.5;
/** Damage a unit deals when it lands directly on the enemy bunker. */
export const DIRECT_HIT_MULTIPLIER = 1.5;
/** The higher-level unit wins a crash but still takes this fraction of the loser's attack. */
export const CRASH_WINNER_DAMAGE = 0.25;
/**
 * A mine that goes off also blasts everything within `radius` (measured to the target's edge), friend or foe,
 * as fractions of the mine's attack. Other mines in the blast go off too. Packing mines around your own
 * bunker therefore backfires when an enemy lands on one of them.
 */
export const MINE_BLAST = { radius: 70, unitDamage: 0.55, bunkerDamage: 1 } as const;
/** Overcharge counts as this many extra levels in a crash (and +50% attack in volleys). */
export const BOOST_CRASH_LEVELS = 1;
export const MAX_VOLLEYS = 4;

export const BUNKER = {
  hp: 1400,
  turretAtk: 45,
  turretRange: 105,
  bodyRadius: 40,
  shieldHp: 350,
};

/** Radar reveals hidden enemy units within this distance of the tapped point. */
export const RADAR_RADIUS = 120;

/** Each level adds 20% HP and attack, Clash-of-Clans style. */
export const MAX_LEVEL = 5;
export const levelMultiplier = (level: number): number => 1 + (Math.min(level, MAX_LEVEL) - 1) * 0.2;

export const STAR_THRESHOLDS = { one: 0.3, two: 0.6 };

export const DECK: Record<UnitType, number> = {
  tank: 2,
  mortar: 3,
  bomb: 2,
  rocket: 1,
};

export const DECK_SIZE = Object.values(DECK).reduce((sum, n) => sum + n, 0);

export const SKILL_INFO: Record<SkillType, { name: string; blurb: string; consumesTurn: boolean }> = {
  hide: { name: 'Hide', blurb: 'Next unit is invisible to the enemy until the fold.', consumesTurn: false },
  boost: { name: 'Overcharge', blurb: 'Next unit hits 50% harder.', consumesTurn: false },
  radar: { name: 'Radar', blurb: 'Reveal hidden enemy units in a circle.', consumesTurn: false },
  shield: { name: 'Shield', blurb: `Bunker gets a ${BUNKER.shieldHp} HP energy shield.`, consumesTurn: false },
  foldpreview: { name: 'Fold Preview', blurb: 'Shows where enemy units will land on your sector for 3 seconds.', consumesTurn: false },
};

export const PLACEMENT_TURN_SECONDS = 20;
