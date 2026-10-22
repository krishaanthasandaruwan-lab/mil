export type Side = 'P1' | 'P2';

export type UnitType = 'tank' | 'mortar' | 'bomb' | 'rocket';

export type SkillType = 'hide' | 'boost' | 'radar' | 'shield' | 'foldpreview';

/**
 * Free field position in hinge-relative units: x runs across the field, y grows away from the hinge on both
 * halves. Folding the phone lays P1's (x, y) exactly on top of P2's (x, y) — there is no grid to snap to,
 * so players have to judge the mirrored spot by eye.
 */
export type Point = { x: number; y: number };

export type PlacedUnit = {
  id: string;
  side: Side;
  type: UnitType;
  pos: Point;
  level: number;
  hidden: boolean;
  boosted: boolean;
};

export type Bunker = {
  side: Side;
  pos: Point;
  level: number;
  shielded: boolean;
};

export type BunkerTargetId = `bunker-${Side}`;
export type TargetId = string | BunkerTargetId;

export type AttackStyle = 'cannon' | 'shell' | 'rocket' | 'turret' | 'ram';

export type BattleEvent =
  | { kind: 'phase'; phase: 'reveal' | 'mines' | 'clash' | 'volley'; round?: number }
  | { kind: 'reveal'; unitId: string }
  | { kind: 'defuse'; tankId: string; bombId: string }
  | { kind: 'mineBlast'; bombId: string; ambush: boolean; hits: Hit[]; /** Set off by another mine's blast. */ chain?: boolean }
  | { kind: 'clash'; pos: Point; p1Id: TargetId; p2Id: TargetId; hits: Hit[]; levels?: [number, number]; result?: CrashResult }
  | { kind: 'attack'; attackerId: TargetId; style: AttackStyle; hits: Hit[] }
  | { kind: 'shieldBreak'; side: Side }
  | { kind: 'bunkerDestroyed'; side: Side };

export type Hit = {
  targetId: TargetId;
  damage: number;
  killed: boolean;
  remainingHp: number;
};

/** How a crash between two landed units ended (levels include Overcharge). */
export type CrashResult = 'p1' | 'p2' | 'both';

export type SideResult = {
  bunkerHp: number;
  bunkerMaxHp: number;
  damageDealtPct: number;
  stars: number;
  survivors: number;
};

export type BattleOutcome = {
  winner: Side | 'draw';
  P1: SideResult;
  P2: SideResult;
};

export type BattleReport = {
  events: BattleEvent[];
  outcome: BattleOutcome;
};

export const otherSide = (side: Side): Side => (side === 'P1' ? 'P2' : 'P1');

export const bunkerId = (side: Side): BunkerTargetId => `bunker-${side}`;
