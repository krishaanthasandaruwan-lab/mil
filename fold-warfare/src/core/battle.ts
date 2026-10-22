import {
  BOOST_CRASH_LEVELS,
  BOOST_MULTIPLIER,
  BUNKER,
  CRASH_WINNER_DAMAGE,
  DIRECT_HIT_MULTIPLIER,
  MAX_VOLLEYS,
  MINE_BLAST,
  STAR_THRESHOLDS,
  UNITS,
  levelMultiplier,
} from './balance';
import { distance } from './geometry';
import {
  bunkerId,
  otherSide,
  type AttackStyle,
  type BattleEvent,
  type BattleOutcome,
  type BattleReport,
  type Bunker,
  type CrashResult,
  type Hit,
  type PlacedUnit,
  type Point,
  type Side,
  type SideResult,
  type TargetId,
  type UnitType,
} from './types';

type Combatant = {
  id: TargetId;
  side: Side;
  kind: UnitType | 'bunker';
  pos: Point;
  radius: number;
  /** Level used in crashes: Armory level, +1 when Overcharged. */
  crashLevel: number;
  hp: number;
  maxHp: number;
  shield: number;
  atk: number;
  range: number;
  hidden: boolean;
  alive: boolean;
};

const ATTACK_STYLE: Record<UnitType | 'bunker', AttackStyle> = {
  tank: 'cannon',
  mortar: 'shell',
  rocket: 'rocket',
  bomb: 'ram',
  bunker: 'turret',
};

const toCombatant = (unit: PlacedUnit): Combatant => {
  const stats = UNITS[unit.type];
  const mult = levelMultiplier(unit.level);
  return {
    id: unit.id,
    side: unit.side,
    kind: unit.type,
    pos: unit.pos,
    radius: stats.bodyRadius,
    crashLevel: unit.level + (unit.boosted ? BOOST_CRASH_LEVELS : 0),
    hp: Math.round(stats.hp * mult),
    maxHp: Math.round(stats.hp * mult),
    shield: 0,
    atk: Math.round(stats.atk * mult * (unit.boosted ? BOOST_MULTIPLIER : 1)),
    range: stats.range,
    hidden: unit.hidden,
    alive: true,
  };
};

const bunkerCombatant = (bunker: Bunker): Combatant => {
  const mult = levelMultiplier(bunker.level);
  return {
    id: bunkerId(bunker.side),
    side: bunker.side,
    kind: 'bunker',
    pos: bunker.pos,
    radius: BUNKER.bodyRadius,
    crashLevel: bunker.level,
    hp: Math.round(BUNKER.hp * mult),
    maxHp: Math.round(BUNKER.hp * mult),
    shield: bunker.shielded ? BUNKER.shieldHp : 0,
    atk: Math.round(BUNKER.turretAtk * mult),
    range: BUNKER.turretRange,
    hidden: false,
    alive: true,
  };
};

const isFighter = (c: Combatant): boolean => c.alive && c.kind !== 'bomb';

/** Bodies touching after the fold: the paper-fold "dots land on each other" rule. */
const overlaps = (a: Combatant, b: Combatant): boolean => distance(a.pos, b.pos) < a.radius + b.radius;

/** Reach is measured to the edge of the target, so big targets (bunkers) are easier to hit. */
const inReach = (attacker: Combatant, target: Combatant, reach: number): boolean =>
  distance(attacker.pos, target.pos) - target.radius <= reach;

/** Raw volley damage before shields. No unit type counters another — only levels and positions matter. */
const damageAgainst = (attacker: Combatant, target: Combatant): number => {
  if (target.kind !== 'bunker') return attacker.atk;
  const mult = attacker.kind === 'bunker' ? 0 : UNITS[attacker.kind].bunkerMultiplier;
  return Math.round(attacker.atk * mult);
};

/**
 * Battle phases after the fold:
 *  1. Reveal hidden units.
 *  2. Crash: units whose bodies landed on enemy units collide. Higher level wins, equal levels destroy
 *     both. Mines are crash traps under the same rule. Units landing on the enemy bunker hit it directly.
 *  3. Volleys: survivors fire at the best enemy within range, up to MAX_VOLLEYS rounds.
 */
class BattleResolver {
  private readonly all: Combatant[];
  private readonly bunkers: Record<Side, Combatant>;
  readonly events: BattleEvent[] = [];
  private readonly shieldBroken: Record<Side, boolean> = { P1: false, P2: false };
  /** Mines set off by another mine's blast, played right after the crash that triggered them. */
  private chainBlasts: BattleEvent[] = [];

  constructor(units: PlacedUnit[], bunkers: Record<Side, Bunker>) {
    this.bunkers = { P1: bunkerCombatant(bunkers.P1), P2: bunkerCombatant(bunkers.P2) };
    const sorted = [...units].sort((a, b) => a.id.localeCompare(b.id));
    this.all = [...sorted.map(toCombatant), this.bunkers.P1, this.bunkers.P2];
  }

  run(): BattleReport {
    this.revealHidden();
    this.resolveCrashes();
    for (let round = 1; round <= MAX_VOLLEYS && !this.isOver(); round++) {
      if (!this.fireVolley(round)) break;
    }
    return { events: this.events, outcome: this.outcome() };
  }

  private revealHidden(): void {
    const hidden = this.all.filter((c) => c.hidden);
    if (hidden.length === 0) return;
    this.events.push({ kind: 'phase', phase: 'reveal' });
    hidden.forEach((c) => this.events.push({ kind: 'reveal', unitId: String(c.id) }));
  }

  private resolveCrashes(): void {
    // Closest touching pairs crash first; a unit crashes at most once, a bunker can be rammed by many.
    const live = this.all.filter((c) => c.alive);
    const pairs = live
      .filter((a) => a.side === 'P1')
      .flatMap((a) => live.filter((b) => b.side === 'P2' && overlaps(a, b)).map((b) => ({ a, b, d: distance(a.pos, b.pos) })))
      .filter(({ a, b }) => !(a.kind === 'bunker' && b.kind === 'bunker'))
      .filter(({ a, b }) => !((a.kind === 'bomb' && b.kind === 'bunker') || (a.kind === 'bunker' && b.kind === 'bomb')))
      .sort((x, y) => x.d - y.d);

    const engaged = new Set<TargetId>();
    const crashEvents: BattleEvent[] = [];
    pairs.forEach(({ a, b }) => {
      const busy = (c: Combatant): boolean => c.kind !== 'bunker' && engaged.has(c.id);
      if (busy(a) || busy(b) || !a.alive || !b.alive) return;
      engaged.add(a.id);
      engaged.add(b.id);
      crashEvents.push(this.crash(a, b), ...this.chainBlasts);
      this.chainBlasts = [];
    });

    if (crashEvents.length === 0) return;
    this.events.push({ kind: 'phase', phase: 'clash' }, ...crashEvents);
    this.checkBunkers();
  }

  private crash(a: Combatant, b: Combatant): BattleEvent {
    const pos = { x: (a.pos.x + b.pos.x) / 2, y: (a.pos.y + b.pos.y) / 2 };
    const unit = a.kind === 'bunker' ? b : a;
    const bunker = a.kind === 'bunker' ? a : b.kind === 'bunker' ? b : undefined;
    if (bunker) {
      // Landing on a bunker is a direct hit; the bunker's turret answers at point-blank range.
      const hits = [
        this.applyDamage(bunker, Math.round(damageAgainst(unit, bunker) * DIRECT_HIT_MULTIPLIER)),
        this.applyDamage(unit, bunker.atk),
      ];
      return { kind: 'clash', pos, p1Id: a.id, p2Id: b.id, hits };
    }

    const result: CrashResult = a.crashLevel > b.crashLevel ? 'p1' : b.crashLevel > a.crashLevel ? 'p2' : 'both';
    const mine = a.kind === 'bomb' ? a : b.kind === 'bomb' ? b : undefined;
    const other = mine === a ? b : a;

    if (mine && other !== mine) {
      const mineWins = result === 'both' || (result === 'p1' ? a === mine : b === mine);
      if (!mineWins) {
        mine.alive = false;
        return { kind: 'defuse', tankId: String(other.id), bombId: String(mine.id) };
      }
      mine.alive = false;
      const hits = [this.applyDamage(other, other.hp + other.shield), ...this.blastAround(mine)];
      return { kind: 'mineBlast', bombId: String(mine.id), ambush: mine.hidden, hits };
    }

    const hits: Hit[] = [];
    if (result === 'both') {
      hits.push(this.applyDamage(b, b.hp), this.applyDamage(a, a.hp));
    } else {
      const [winner, loser] = result === 'p1' ? [a, b] : [b, a];
      hits.push(this.applyDamage(loser, loser.hp), this.applyDamage(winner, Math.round(loser.atk * CRASH_WINNER_DAMAGE)));
    }
    return { kind: 'clash', pos, p1Id: a.id, p2Id: b.id, hits, levels: [a.crashLevel, b.crashLevel], result };
  }

  /** Splash from a detonating mine: hits both sides, and sets off any other mine caught in it. */
  private blastAround(mine: Combatant): Hit[] {
    const caught = this.all.filter((c) => c.alive && c !== mine && inReach(mine, c, MINE_BLAST.radius));
    const hits: Hit[] = [];
    const chained: Combatant[] = [];
    caught.forEach((c) => {
      if (c.kind === 'bomb') {
        c.alive = false;
        chained.push(c);
        return;
      }
      const share = c.kind === 'bunker' ? MINE_BLAST.bunkerDamage : MINE_BLAST.unitDamage;
      hits.push(this.applyDamage(c, Math.round(mine.atk * share)));
    });
    chained.forEach((c) => this.chainBlasts.push({ kind: 'mineBlast', bombId: String(c.id), ambush: false, chain: true, hits: this.blastAround(c) }));
    return hits;
  }

  private fireVolley(round: number): boolean {
    const pending = new Map<TargetId, number>();
    const shots: { attacker: Combatant; target: Combatant; damage: number }[] = [];

    this.all.filter(isFighter).forEach((attacker) => {
      const target = this.pickTarget(attacker, pending);
      if (!target) return;
      const damage = damageAgainst(attacker, target);
      if (damage <= 0) return;
      pending.set(target.id, (pending.get(target.id) ?? 0) + damage);
      shots.push({ attacker, target, damage });
    });

    if (shots.length === 0) return false;
    this.events.push({ kind: 'phase', phase: 'volley', round });
    shots.forEach(({ attacker, target, damage }) => {
      const hit = this.applyDamage(target, damage);
      this.events.push({ kind: 'attack', attackerId: attacker.id, style: ATTACK_STYLE[attacker.kind], hits: [hit] });
    });
    this.checkBunkers();
    return true;
  }

  private pickTarget(attacker: Combatant, pending: Map<TargetId, number>): Combatant | undefined {
    const inRange = this.all.filter(
      (c) =>
        isFighter(c) &&
        c.side !== attacker.side &&
        inReach(attacker, c, attacker.range) &&
        c.hp + c.shield - (pending.get(c.id) ?? 0) > 0,
    );

    const score = (target: Combatant): number => {
      if (attacker.kind === 'bunker') return target.kind === 'bunker' ? -1 : 1000 - target.hp;
      if (target.kind === 'bunker') return attacker.kind === 'rocket' ? 500 : 250;
      const effectiveHp = target.hp - (pending.get(target.id) ?? 0);
      const killable = damageAgainst(attacker, target) >= effectiveHp ? 160 : 0;
      return 100 + killable - target.hp / 20;
    };

    let best: Combatant | undefined;
    let bestScore = 0;
    inRange.forEach((target) => {
      const s = score(target);
      if (s > bestScore) {
        best = target;
        bestScore = s;
      }
    });
    return best;
  }

  private applyDamage(target: Combatant, damage: number): Hit {
    let remaining = damage;
    if (target.shield > 0) {
      const absorbed = Math.min(target.shield, remaining);
      target.shield -= absorbed;
      remaining -= absorbed;
      if (target.shield === 0 && !this.shieldBroken[target.side] && target.kind === 'bunker') {
        this.shieldBroken[target.side] = true;
        this.events.push({ kind: 'shieldBreak', side: target.side });
      }
    }
    target.hp = Math.max(0, target.hp - remaining);
    const killed = target.alive && (target.hp === 0 || target.kind === 'bomb');
    if (killed) target.alive = false;
    return { targetId: target.id, damage, killed, remainingHp: target.hp };
  }

  private checkBunkers(): void {
    (['P1', 'P2'] as const).forEach((side) => {
      const bunker = this.bunkers[side];
      if (bunker.hp > 0 || this.events.some((e) => e.kind === 'bunkerDestroyed' && e.side === side)) return;
      this.events.push({ kind: 'bunkerDestroyed', side });
    });
  }

  private isOver(): boolean {
    return this.bunkers.P1.hp === 0 || this.bunkers.P2.hp === 0;
  }

  private sideResult(side: Side): SideResult {
    const enemyBunker = this.bunkers[otherSide(side)];
    const damageDealtPct = (enemyBunker.maxHp - enemyBunker.hp) / enemyBunker.maxHp;
    const stars =
      enemyBunker.hp === 0 ? 3 : damageDealtPct >= STAR_THRESHOLDS.two ? 2 : damageDealtPct >= STAR_THRESHOLDS.one ? 1 : 0;
    const own = this.bunkers[side];
    return {
      bunkerHp: own.hp,
      bunkerMaxHp: own.maxHp,
      damageDealtPct,
      stars,
      survivors: this.all.filter((c) => c.side === side && c.alive && c.kind !== 'bunker' && c.kind !== 'bomb').length,
    };
  }

  private outcome(): BattleOutcome {
    const P1 = this.sideResult('P1');
    const P2 = this.sideResult('P2');
    const compare = (a: number, b: number): Side | undefined => (a > b ? 'P1' : b > a ? 'P2' : undefined);
    const winner =
      compare(P1.stars, P2.stars) ??
      compare(Math.round(P1.damageDealtPct * 1000), Math.round(P2.damageDealtPct * 1000)) ??
      compare(P1.survivors, P2.survivors) ??
      'draw';
    // A win is always worth at least one star, Clash-of-Clans style.
    if (winner !== 'draw') {
      const w = winner === 'P1' ? P1 : P2;
      w.stars = Math.max(1, w.stars);
    }
    return { winner, P1, P2 };
  }
}

export const resolveBattle = (units: PlacedUnit[], bunkers: Record<Side, Bunker>): BattleReport =>
  new BattleResolver(units, bunkers).run();

/** Starting HP for every combatant, so the renderer can draw full health bars before playback. */
export const initialHealth = (units: PlacedUnit[], bunkers: Record<Side, Bunker>): Map<TargetId, number> => {
  const map = new Map<TargetId, number>();
  units.forEach((u) => map.set(u.id, toCombatant(u).maxHp));
  (['P1', 'P2'] as const).forEach((side) => {
    const b = bunkerCombatant(bunkers[side]);
    map.set(b.id, b.maxHp);
  });
  return map;
};
