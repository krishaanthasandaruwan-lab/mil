import { BUNKER, DECK, RADAR_RADIUS, UNITS } from './balance';
import { distance, fitsOnField } from './geometry';
import { otherSide, type Bunker, type PlacedUnit, type Point, type Side, type SkillType, type UnitType } from './types';

export type MatchMode = 'bot' | 'local' | 'online';
export type MatchPhase = 'bunker' | 'units' | 'ready';
export type ArmableSkill = 'hide' | 'boost';

export type Loadout = {
  levels: Record<UnitType | 'bunker', number>;
  skills: Record<SkillType, number>;
};

export type PlayerState = {
  side: Side;
  remaining: Record<UnitType, number>;
  skillsLeft: Record<SkillType, number>;
  armed: Record<ArmableSkill, boolean>;
  levels: Record<UnitType | 'bunker', number>;
  bunker: Bunker | undefined;
  /** Enemy hidden units this player has exposed with radar. */
  revealed: Set<string>;
};

export const DEFAULT_LOADOUT: Loadout = {
  levels: { tank: 1, mortar: 1, bomb: 1, rocket: 1, bunker: 1 },
  skills: { hide: 1, boost: 1, radar: 1, shield: 1, foldpreview: 1 },
};

const createPlayer = (side: Side, loadout: Loadout): PlayerState => ({
  side,
  remaining: { ...DECK },
  skillsLeft: { ...loadout.skills },
  armed: { hide: false, boost: false },
  levels: { ...loadout.levels },
  bunker: undefined,
  revealed: new Set(),
});

/** Plain-JSON snapshot of a match, used as the Game Center turn-based match data. */
export type MatchState = {
  v: 1;
  mode: MatchMode;
  phase: MatchPhase;
  turn: Side;
  firstUnitTurn: Side;
  nextId: number;
  units: PlacedUnit[];
  players: Record<Side, Omit<PlayerState, 'revealed'> & { revealed: string[] }>;
  /** Online: who has folded their phone. The battle starts once both have. */
  folded?: Record<Side, boolean>;
};

export class Match {
  readonly mode: MatchMode;
  phase: MatchPhase = 'bunker';
  turn: Side = 'P1';
  readonly units: PlacedUnit[] = [];
  readonly players: Record<Side, PlayerState>;
  readonly folded: Record<Side, boolean> = { P1: false, P2: false };
  private firstUnitTurn: Side;
  private nextId = 1;

  constructor(mode: MatchMode, loadouts: Record<Side, Loadout>, firstUnitTurn: Side = 'P1') {
    this.mode = mode;
    this.firstUnitTurn = firstUnitTurn;
    this.players = { P1: createPlayer('P1', loadouts.P1), P2: createPlayer('P2', loadouts.P2) };
  }

  unitsLeft(side: Side): number {
    return Object.values(this.players[side].remaining).reduce((sum, n) => sum + n, 0);
  }

  ownUnits(side: Side): PlacedUnit[] {
    return this.units.filter((u) => u.side === side);
  }

  /** What `viewer` can see of the enemy army: everything except hidden units they haven't radar-scanned. */
  visibleEnemyUnits(viewer: Side): PlacedUnit[] {
    const revealed = this.players[viewer].revealed;
    return this.units.filter((u) => u.side !== viewer && (!u.hidden || revealed.has(u.id)));
  }

  enemyBunkerVisible(viewer: Side): Bunker | undefined {
    return this.phase === 'bunker' ? undefined : this.players[otherSide(viewer)].bunker;
  }

  /** Own units can't stack on each other or on their own bunker; enemy positions are irrelevant here. */
  canPlaceUnit(side: Side, type: UnitType, pos: Point): boolean {
    const radius = UNITS[type].bodyRadius;
    if (!fitsOnField(pos, radius)) return false;
    const bunker = this.players[side].bunker;
    if (bunker && distance(bunker.pos, pos) < BUNKER.bodyRadius + radius) return false;
    return !this.ownUnits(side).some((u) => distance(u.pos, pos) < UNITS[u.type].bodyRadius + radius);
  }

  canPlaceBunker(pos: Point): boolean {
    return fitsOnField(pos, BUNKER.bodyRadius);
  }

  placeBunker(side: Side, pos: Point): void {
    this.assertTurn(side, 'bunker');
    if (!this.canPlaceBunker(pos)) throw new Error(`Bunker at ${pos.x},${pos.y} is off the field`);
    const player = this.players[side];
    player.bunker = { side, pos, level: player.levels.bunker, shielded: false };
    if (side === 'P1') {
      this.turn = 'P2';
      return;
    }
    this.phase = 'units';
    this.turn = this.firstUnitTurn;
  }

  armSkill(side: Side, skill: ArmableSkill): void {
    this.assertTurn(side, 'units');
    const player = this.players[side];
    if (player.armed[skill]) {
      player.armed[skill] = false;
      return;
    }
    if (player.skillsLeft[skill] <= 0) throw new Error(`${side} has no ${skill} left`);
    player.armed[skill] = true;
  }

  placeUnit(side: Side, type: UnitType, pos: Point): PlacedUnit {
    this.assertTurn(side, 'units');
    const player = this.players[side];
    if (player.remaining[type] <= 0) throw new Error(`${side} has no ${type} left`);
    if (!this.canPlaceUnit(side, type, pos)) throw new Error(`${side} cannot place ${type} at ${pos.x},${pos.y}`);

    const unit: PlacedUnit = {
      id: `${side}-${type}-${this.nextId++}`,
      side,
      type,
      pos,
      level: player.levels[type],
      hidden: player.armed.hide,
      boosted: player.armed.boost,
    };
    (['hide', 'boost'] as const).forEach((skill) => {
      if (!player.armed[skill]) return;
      player.armed[skill] = false;
      player.skillsLeft[skill]--;
    });
    player.remaining[type]--;
    this.units.push(unit);
    this.advanceTurn();
    return unit;
  }

  /** Free action: exposes enemy hidden units within RADAR_RADIUS of `center`. */
  useRadar(side: Side, center: Point): PlacedUnit[] {
    this.assertTurn(side, 'units');
    const player = this.players[side];
    if (player.skillsLeft.radar <= 0) throw new Error(`${side} has no radar left`);
    player.skillsLeft.radar--;
    const found = this.units.filter(
      (u) => u.side !== side && u.hidden && distance(u.pos, center) <= RADAR_RADIUS + UNITS[u.type].bodyRadius,
    );
    found.forEach((u) => player.revealed.add(u.id));
    return found;
  }

  /** Free action, purely informational: the view shows mirrored enemy positions for a few seconds. */
  useFoldPreview(side: Side): void {
    this.assertTurn(side, 'units');
    const player = this.players[side];
    if (player.skillsLeft.foldpreview <= 0) throw new Error(`${side} has no fold preview left`);
    player.skillsLeft.foldpreview--;
  }

  useShield(side: Side): void {
    this.assertTurn(side, 'units');
    const player = this.players[side];
    if (player.skillsLeft.shield <= 0 || !player.bunker || player.bunker.shielded) {
      throw new Error(`${side} cannot shield now`);
    }
    player.skillsLeft.shield--;
    player.bunker.shielded = true;
  }

  markFolded(side: Side): void {
    if (this.phase !== 'ready') throw new Error('Cannot fold before both armies are deployed');
    this.folded[side] = true;
  }

  get bothFolded(): boolean {
    return this.folded.P1 && this.folded.P2;
  }

  toState(): MatchState {
    const player = (side: Side): MatchState['players'][Side] => {
      const p = this.players[side];
      return { ...p, remaining: { ...p.remaining }, skillsLeft: { ...p.skillsLeft }, armed: { ...p.armed }, levels: { ...p.levels }, revealed: [...p.revealed] };
    };
    return {
      v: 1,
      mode: this.mode,
      phase: this.phase,
      turn: this.turn,
      firstUnitTurn: this.firstUnitTurn,
      nextId: this.nextId,
      units: this.units.map((u) => ({ ...u, pos: { ...u.pos } })),
      players: { P1: player('P1'), P2: player('P2') },
      folded: { ...this.folded },
    };
  }

  static fromState(state: MatchState): Match {
    if (state.v !== 1) throw new Error(`Unsupported match data version ${String(state.v)}`);
    const loadout = (side: Side): Loadout => ({ levels: state.players[side].levels, skills: state.players[side].skillsLeft });
    const match = new Match(state.mode, { P1: loadout('P1'), P2: loadout('P2') }, state.firstUnitTurn);
    match.phase = state.phase;
    match.turn = state.turn;
    match.nextId = state.nextId;
    match.units.push(...state.units);
    Object.assign(match.folded, state.folded);
    (['P1', 'P2'] as const).forEach((side) => {
      const src = state.players[side];
      match.players[side] = { ...src, revealed: new Set(src.revealed) };
    });
    return match;
  }

  battleSetup(): { units: PlacedUnit[]; bunkers: Record<Side, Bunker> } {
    const { P1, P2 } = this.players;
    if (this.phase !== 'ready' || !P1.bunker || !P2.bunker) throw new Error('Match is not ready to fold');
    return { units: [...this.units], bunkers: { P1: P1.bunker, P2: P2.bunker } };
  }

  private advanceTurn(): void {
    const opponent = otherSide(this.turn);
    if (this.unitsLeft(opponent) > 0) {
      this.turn = opponent;
      return;
    }
    if (this.unitsLeft(this.turn) === 0) this.phase = 'ready';
  }

  private assertTurn(side: Side, phase: MatchPhase): void {
    if (this.phase !== phase) throw new Error(`Expected phase ${phase}, match is in ${this.phase}`);
    if (this.turn !== side) throw new Error(`It is ${this.turn}'s turn, not ${side}'s`);
  }
}
