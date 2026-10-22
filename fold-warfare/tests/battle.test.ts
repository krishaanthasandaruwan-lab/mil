import { describe, expect, it } from 'vitest';
import { chooseBunkerPos, takeBotTurn } from '../src/core/ai';
import { resolveBattle } from '../src/core/battle';
import { DEFAULT_LOADOUT, Match } from '../src/core/match';
import type { Bunker, PlacedUnit, Point, Side, UnitType } from '../src/core/types';

const unit = (side: Side, type: UnitType, x: number, y: number, extra: Partial<PlacedUnit> = {}): PlacedUnit => ({
  id: `${side}-${type}-${x}-${y}`,
  side,
  type,
  pos: { x, y },
  level: 1,
  hidden: false,
  boosted: false,
  ...extra,
});

const bunkers = (p1: Point = { x: 60, y: 380 }, p2: Point = { x: 580, y: 380 }): Record<Side, Bunker> => ({
  P1: { side: 'P1', pos: p1, level: 1, shielded: false },
  P2: { side: 'P2', pos: p2, level: 1, shielded: false },
});

const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

describe('crash rule (bodies touching after the fold)', () => {
  it('same level: both units are destroyed', () => {
    const { events } = resolveBattle([unit('P1', 'mortar', 250, 200), unit('P2', 'tank', 258, 206)], bunkers());
    const crash = events.find((e) => e.kind === 'clash');
    expect(crash?.kind === 'clash' && crash.result).toBe('both');
    expect(crash?.kind === 'clash' && crash.hits.every((h) => h.killed)).toBe(true);
  });

  it('higher level wins and survives, whatever the unit type', () => {
    const { events } = resolveBattle([unit('P1', 'mortar', 250, 200, { level: 3 }), unit('P2', 'tank', 258, 206, { level: 2 })], bunkers());
    const crash = events.find((e) => e.kind === 'clash');
    expect(crash?.kind === 'clash' && crash.result).toBe('p1');
    expect(crash?.kind === 'clash' && crash.hits[0]).toMatchObject({ targetId: 'P2-tank-258-206', killed: true });
    expect(crash?.kind === 'clash' && crash.hits[1]?.killed).toBe(false);
  });

  it('Overcharge counts as one extra level in a crash', () => {
    const { events } = resolveBattle([unit('P1', 'tank', 250, 200, { boosted: true }), unit('P2', 'tank', 258, 206)], bunkers());
    const crash = events.find((e) => e.kind === 'clash');
    expect(crash?.kind === 'clash' && crash.result).toBe('p1');
  });

  it('a near miss is NOT a crash - aim matters', () => {
    const { events } = resolveBattle([unit('P1', 'mortar', 250, 200), unit('P2', 'tank', 300, 200)], bunkers());
    expect(events.some((e) => e.kind === 'clash')).toBe(false);
  });

  it('a unit landing on the enemy bunker hits it directly', () => {
    const { events } = resolveBattle([unit('P1', 'tank', 565, 372)], bunkers());
    const crash = events.find((e) => e.kind === 'clash');
    expect(crash?.kind === 'clash' && crash.p2Id).toBe('bunker-P2');
  });

  it('each unit crashes only once', () => {
    const { events } = resolveBattle(
      [unit('P1', 'mortar', 250, 200), unit('P2', 'tank', 255, 205), unit('P2', 'tank', 245, 195)],
      bunkers(),
    );
    expect(events.filter((e) => e.kind === 'clash')).toHaveLength(1);
  });
});

describe('mines', () => {
  it('same-level unit landing on a mine: both are gone', () => {
    const { events } = resolveBattle([unit('P1', 'bomb', 200, 150, { hidden: true }), unit('P2', 'mortar', 205, 155)], bunkers());
    const blast = events.find((e) => e.kind === 'mineBlast');
    expect(blast?.kind === 'mineBlast' && blast.ambush).toBe(true);
    expect(blast?.kind === 'mineBlast' && blast.hits[0]?.killed).toBe(true);
  });

  it('a higher-level unit clears the mine and survives', () => {
    const { events } = resolveBattle([unit('P1', 'bomb', 200, 150), unit('P2', 'tank', 205, 155, { level: 2 })], bunkers());
    expect(events.some((e) => e.kind === 'defuse')).toBe(true);
    expect(events.some((e) => e.kind === 'mineBlast')).toBe(false);
  });

  it('a mine does nothing to units that only land near it', () => {
    const { events } = resolveBattle([unit('P1', 'bomb', 200, 150), unit('P2', 'mortar', 260, 150)], bunkers());
    expect(events.some((e) => e.kind === 'mineBlast' || e.kind === 'defuse')).toBe(false);
  });

  it('the blast hits your own bunker when the mine sits next to it', () => {
    const report = resolveBattle([unit('P1', 'bomb', 130, 380), unit('P2', 'mortar', 133, 383)], bunkers());
    const blast = report.events.find((e) => e.kind === 'mineBlast');
    const ownBunkerHit = blast?.kind === 'mineBlast' ? blast.hits.find((h) => h.targetId === 'bunker-P1') : undefined;
    expect(ownBunkerHit?.damage).toBe(170);
    expect(report.outcome.P2.damageDealtPct).toBeGreaterThan(0.1);
  });

  it('the blast damages nearby units of both sides', () => {
    const { events } = resolveBattle(
      [unit('P1', 'bomb', 200, 150), unit('P2', 'tank', 204, 152), unit('P1', 'mortar', 150, 150), unit('P2', 'mortar', 250, 160)],
      bunkers(),
    );
    const blast = events.find((e) => e.kind === 'mineBlast');
    const splash = blast?.kind === 'mineBlast' ? blast.hits.slice(1).map((h) => h.targetId) : [];
    expect(splash).toEqual(expect.arrayContaining(['P1-mortar-150-150', 'P2-mortar-250-160']));
  });

  it('mines caught in a blast go off too', () => {
    const { events } = resolveBattle([unit('P1', 'bomb', 200, 150), unit('P1', 'bomb', 262, 150), unit('P2', 'tank', 204, 152)], bunkers());
    const blasts = events.filter((e) => e.kind === 'mineBlast');
    expect(blasts).toHaveLength(2);
    expect(blasts[1]?.kind === 'mineBlast' && blasts[1].chain).toBe(true);
  });
});

describe('range limits', () => {
  it('units out of range never touch the bunker', () => {
    const report = resolveBattle([unit('P1', 'tank', 60, 60)], bunkers());
    expect(report.outcome.P1.damageDealtPct).toBe(0);
    expect(report.events.some((e) => e.kind === 'attack')).toBe(false);
  });

  it('rockets siege bunkers from long range', () => {
    const report = resolveBattle([unit('P1', 'rocket', 320, 380)], bunkers({ x: 60, y: 60 }));
    expect(report.outcome.P1.damageDealtPct).toBeGreaterThan(0);
  });
});

describe('win condition', () => {
  it('destroying the bunker gives 3 stars and the win', () => {
    const army = [
      unit('P1', 'tank', 575, 378, { boosted: true }),
      unit('P1', 'rocket', 430, 300),
      unit('P1', 'mortar', 480, 320),
      unit('P1', 'mortar', 540, 250),
      unit('P1', 'rocket', 430, 410),
      unit('P1', 'tank', 520, 330),
    ];
    const { outcome, events } = resolveBattle(army, bunkers());
    expect(events.some((e) => e.kind === 'bunkerDestroyed' && e.side === 'P2')).toBe(true);
    expect(outcome.P1.stars).toBe(3);
    expect(outcome.winner).toBe('P1');
  });
});

describe('match flow', () => {
  it('alternates placements and hides hidden units from the enemy', () => {
    const match = new Match('local', { P1: DEFAULT_LOADOUT, P2: DEFAULT_LOADOUT });
    match.placeBunker('P1', { x: 80, y: 360 });
    match.placeBunker('P2', { x: 480, y: 360 });
    match.armSkill('P1', 'hide');
    match.placeUnit('P1', 'bomb', { x: 200, y: 150 });
    expect(match.turn).toBe('P2');
    expect(match.visibleEnemyUnits('P2')).toHaveLength(0);
    match.useRadar('P2', { x: 220, y: 170 });
    expect(match.visibleEnemyUnits('P2')).toHaveLength(1);
  });

  it('rejects stacking your own units', () => {
    const match = new Match('local', { P1: DEFAULT_LOADOUT, P2: DEFAULT_LOADOUT });
    match.placeBunker('P1', { x: 80, y: 360 });
    match.placeBunker('P2', { x: 480, y: 360 });
    match.placeUnit('P1', 'tank', { x: 300, y: 200 });
    match.placeUnit('P2', 'tank', { x: 300, y: 200 });
    expect(match.canPlaceUnit('P1', 'mortar', { x: 310, y: 205 })).toBe(false);
    expect(match.canPlaceUnit('P1', 'mortar', { x: 360, y: 205 })).toBe(true);
  });

  it('bot vs bot matches always finish with a sane spread of results', () => {
    const tally = { P1: 0, P2: 0, draw: 0, threeStars: 0, clashes: 0 };
    const rng = seeded(42);
    for (let game = 0; game < 40; game++) {
      const match = new Match('bot', { P1: DEFAULT_LOADOUT, P2: DEFAULT_LOADOUT }, game % 2 ? 'P2' : 'P1');
      match.placeBunker('P1', chooseBunkerPos(rng));
      match.placeBunker('P2', chooseBunkerPos(rng));
      while (match.phase === 'units') takeBotTurn(match, match.turn, 'veteran', rng);
      const { units, bunkers: b } = match.battleSetup();
      const { outcome, events } = resolveBattle(units, b);
      tally[outcome.winner]++;
      tally.clashes += events.filter((e) => e.kind === 'clash').length;
      if (outcome.P1.stars === 3 || outcome.P2.stars === 3) tally.threeStars++;
    }
    console.log('bot vs bot tally', tally);
    expect(tally.P1).toBeGreaterThan(5);
    expect(tally.P2).toBeGreaterThan(5);
  });
});

describe('online match data', () => {
  it('a match survives a save/load round trip exactly', () => {
    const rng = seeded(7);
    const match = new Match('online', { P1: DEFAULT_LOADOUT, P2: DEFAULT_LOADOUT }, 'P2');
    match.placeBunker('P1', chooseBunkerPos(rng));
    match.placeBunker('P2', chooseBunkerPos(rng));
    for (let i = 0; i < 5; i++) takeBotTurn(match, match.turn, 'veteran', rng);
    const restored = Match.fromState(JSON.parse(JSON.stringify(match.toState())));
    expect(restored.toState()).toEqual(match.toState());
    expect(restored.turn).toBe(match.turn);
    takeBotTurn(restored, restored.turn, 'veteran', rng);
    expect(restored.units.length).toBe(6);
  });

  it('online battles start only after both players fold, and folds travel with the match data', () => {
    const rng = seeded(11);
    const match = new Match('online', { P1: DEFAULT_LOADOUT, P2: DEFAULT_LOADOUT }, 'P1');
    expect(() => match.markFolded('P1')).toThrow();
    match.placeBunker('P1', chooseBunkerPos(rng));
    match.placeBunker('P2', chooseBunkerPos(rng));
    while (match.phase !== 'ready') takeBotTurn(match, match.turn, 'recruit', rng);
    match.markFolded('P2');
    expect(match.bothFolded).toBe(false);
    const onOtherPhone = Match.fromState(JSON.parse(JSON.stringify(match.toState())));
    expect(onOtherPhone.folded.P2).toBe(true);
    onOtherPhone.markFolded('P1');
    expect(onOtherPhone.bothFolded).toBe(true);
  });
});
