import { resolveBattle } from './battle';
import { BUNKER, FIELD, MINE_BLAST, UNITS } from './balance';
import { distance } from './geometry';
import type { Match } from './match';
import { otherSide, type Bunker, type PlacedUnit, type Point, type Side, type UnitType } from './types';

export type BotDifficulty = 'recruit' | 'veteran' | 'general';

export type BotTurnSummary = {
  unit: PlacedUnit;
  radarCenter: Point | undefined;
  shielded: boolean;
};

type Rng = () => number;

const NOISE: Record<BotDifficulty, number> = { recruit: 260, veteran: 90, general: 15 };
/** The bot "aims" too: its chosen spot drifts by about this many field units, like a human's eye. */
const AIM_ERROR: Record<BotDifficulty, number> = { recruit: 48, veteran: 28, general: 14 };

const gaussian = (rng: Rng): number => {
  const u = Math.max(rng(), 1e-6);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
};

export const chooseBunkerPos = (rng: Rng): Point => {
  const margin = BUNKER.bodyRadius + 20;
  return {
    x: margin + rng() * (FIELD.width - margin * 2),
    y: margin + rng() * (FIELD.height - margin * 2),
  };
};

/** Scores the fold as if it happened right now, using only what the bot is allowed to see. */
const evaluate = (side: Side, units: PlacedUnit[], bunkers: Record<Side, Bunker>): number => {
  const { outcome } = resolveBattle(units, bunkers);
  const mine = outcome[side];
  const theirs = outcome[otherSide(side)];
  return (
    (mine.stars - theirs.stars) * 400 +
    (mine.damageDealtPct - theirs.damageDealtPct) * 600 +
    (mine.survivors - theirs.survivors) * 25
  );
};

/** Positional instincts the snapshot simulation can't see, because the enemy hasn't finished placing yet. */
const instinct = (type: UnitType, pos: Point, own: PlacedUnit[], ownBunker: Bunker, enemyBunker: Bunker): number => {
  const toOwnBunker = distance(pos, ownBunker.pos);
  const toEnemyBunker = distance(pos, enemyBunker.pos);
  switch (type) {
    case 'bomb': {
      // Guard the approach to the bunker, but from outside the blast so a triggered mine can't hurt it.
      const blastReachesBunker = toOwnBunker - BUNKER.bodyRadius <= MINE_BLAST.radius;
      const guardRing = !blastReachesBunker && toOwnBunker - BUNKER.bodyRadius <= MINE_BLAST.radius + 90;
      const friendsInBlast = own.filter((u) => distance(u.pos, pos) - UNITS[u.type].bodyRadius <= MINE_BLAST.radius).length;
      return (blastReachesBunker ? -120 : guardRing ? 80 : 0) - friendsInBlast * 30 + (toEnemyBunker < 110 ? 30 : 0);
    }
    case 'tank':
      return toEnemyBunker < BUNKER.bodyRadius + 20 ? 120 : toOwnBunker < 130 ? 40 : 0;
    case 'mortar':
      return toEnemyBunker < UNITS.mortar.range ? 60 : 0;
    case 'rocket':
      return toEnemyBunker < UNITS.rocket.range ? 50 - toEnemyBunker / 15 : 0;
  }
};

/** A coarse sweep of the field plus the exact spots that matter: on top of every visible enemy and bunker. */
const candidatePoints = (targets: Point[], ownBunker: Point): Point[] => {
  const points: Point[] = [];
  for (let x = 40; x <= FIELD.width - 40; x += 48) {
    for (let y = 40; y <= FIELD.height - 40; y += 50) points.push({ x, y });
  }
  targets.forEach((t) => {
    points.push(t);
    for (let a = 0; a < 6; a++) points.push({ x: t.x + Math.cos(a) * 40, y: t.y + Math.sin(a) * 40 });
  });
  // Close escort ring, plus a mine ring just outside the blast reach of the bunker.
  [80, BUNKER.bodyRadius + MINE_BLAST.radius + 40].forEach((r) => {
    for (let a = 0; a < 8; a++) points.push({ x: ownBunker.x + Math.cos((a * Math.PI) / 4) * r, y: ownBunker.y + Math.sin((a * Math.PI) / 4) * r });
  });
  return points;
};

const aimWithError = (match: Match, side: Side, type: UnitType, target: Point, spread: number, rng: Rng): Point => {
  for (let attempt = 0; attempt < 12; attempt++) {
    const p = { x: target.x + gaussian(rng) * spread * 0.6, y: target.y + gaussian(rng) * spread * 0.6 };
    if (match.canPlaceUnit(side, type, p)) return p;
  }
  return target;
};

/** Plays one full bot turn on the match: optional radar/shield, then arms skills and places a unit. */
export const takeBotTurn = (match: Match, side: Side, difficulty: BotDifficulty, rng: Rng): BotTurnSummary => {
  const me = match.players[side];
  const enemySide = otherSide(side);
  const ownBunker = me.bunker;
  const enemyBunker = match.enemyBunkerVisible(side);
  if (!ownBunker || !enemyBunker) throw new Error('Bot needs both bunkers placed before choosing units');

  const turnsLeft = match.unitsLeft(side);
  const enemyPlaced = match.ownUnits(enemySide).length;

  let radarCenter: Point | undefined;
  if (me.skillsLeft.radar > 0 && enemyPlaced >= 4 && (turnsLeft <= 4 || rng() < 0.25)) {
    radarCenter = enemyBunker.pos;
    match.useRadar(side, radarCenter);
  }

  const visibleEnemies = match.visibleEnemyUnits(side);
  const knownUnits = [...match.ownUnits(side), ...visibleEnemies];
  const bunkers = { [side]: ownBunker, [enemySide]: enemyBunker } as Record<Side, Bunker>;
  const types = (Object.keys(me.remaining) as UnitType[]).filter((t) => me.remaining[t] > 0);
  const points = candidatePoints([...visibleEnemies.map((u) => u.pos), enemyBunker.pos], ownBunker.pos);

  const candidates: { type: UnitType; pos: Point; score: number }[] = [];
  types.forEach((type) => {
    points
      .filter((pos) => match.canPlaceUnit(side, type, pos))
      .forEach((pos) => {
        const candidate: PlacedUnit = { id: `${side}-sim`, side, type, pos, level: me.levels[type], hidden: false, boosted: false };
        const score =
          evaluate(side, [...knownUnits, candidate], bunkers) +
          instinct(type, pos, match.ownUnits(side), ownBunker, enemyBunker) +
          rng() * NOISE[difficulty];
        candidates.push({ type, pos, score });
      });
  });
  const chosen = candidates.reduce<(typeof candidates)[number] | undefined>(
    (best, c) => (!best || c.score > best.score ? c : best),
    undefined,
  );
  if (!chosen) throw new Error(`Bot ${side} has no legal placement`);

  const aimed = aimWithError(match, side, chosen.type, chosen.pos, AIM_ERROR[difficulty], rng);

  const threatsOnBunker = visibleEnemies.filter((u) => u.type !== 'bomb' && distance(u.pos, ownBunker.pos) < 220).length;
  const shield = me.skillsLeft.shield > 0 && !ownBunker.shielded && (threatsOnBunker >= 2 || turnsLeft === 1);
  const trapsTank = match.ownUnits(side).some((u) => u.type === 'tank' && distance(u.pos, aimed) < 110);
  const hide = me.skillsLeft.hide > 0 && ((chosen.type === 'bomb' && (trapsTank || rng() < 0.5)) || turnsLeft === 1);
  const boost =
    me.skillsLeft.boost > 0 &&
    chosen.type !== 'bomb' &&
    (chosen.type === 'rocket' || distance(aimed, enemyBunker.pos) < BUNKER.bodyRadius || turnsLeft === 1);

  if (shield) match.useShield(side);
  if (hide) match.armSkill(side, 'hide');
  if (boost) match.armSkill(side, 'boost');
  const unit = match.placeUnit(side, chosen.type, aimed);
  return { unit, radarCenter, shielded: shield };
};
