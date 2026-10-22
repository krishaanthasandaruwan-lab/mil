import Phaser from 'phaser';
import { haptic, sfx } from '../audio/sfx';
import { pickTexture } from '../art/assets';
import { chooseBunkerPos, takeBotTurn, type BotDifficulty } from '../core/ai';
import { BUNKER, DECK_SIZE, FIELD, MINE_BLAST, PLACEMENT_TURN_SECONDS, RADAR_RADIUS, SKILL_INFO, UNITS, levelMultiplier } from '../core/balance';
import { botLoadout, consumeSkills, playerLoadout, recordMatchStart } from '../core/economy';
import { DEFAULT_LOADOUT, Match, type Loadout, type MatchMode } from '../core/match';
import { loadProfile, updateProfile } from '../core/profile';
import { distance } from '../core/geometry';
import { otherSide, type PlacedUnit, type Point, type Side, type SkillType, type UnitType } from '../core/types';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, LAYOUT, TEAM, hex, setLayout, toField } from '../theme';
import { GameButton, label, wait } from '../ui/widgets';
import { buildFieldHalf, buildHinge, buildSectorHeader, localPos, sectorMask, type Half, type SectorHeader } from '../view/field';
import { banner, playSheet, purplePoof, sparkBurst, sparks } from '../view/fx';
import { foldSensor } from '../platform/fold';
import { FoldNative, type GcMatch } from '../platform/native';
import { decodeState, encodeState, localSideOf, opponentAlias } from '../platform/online';
import type { PluginListenerHandle } from '@capacitor/core';
import { Tray, UNIT_ORDER } from '../view/Tray';
import { UnitView, facingFor, radiusOf, rangeOf } from '../view/UnitView';

export { unitArt } from '../view/Tray';

export type GameSceneData = {
  /** 'bot' = you vs AI; 'local' = two players face to face on one phone. */
  mode: MatchMode;
  opponent: { name: string; trophies: number };
  difficulty: BotDifficulty;
  /** Online (Game Center) match to resume. */
  online?: GcMatch;
  /** Preview/dev only: start from a half-played match. */
  staged?: Match;
  hover?: Point;
  hoverKind?: UnitType;
};

/** On touch screens the aim point floats ahead of the finger so the finger never hides the target. */
const TOUCH_AIM_OFFSET = 70;
/** How long the Fold Preview skill shows mirrored enemy positions. */
const FOLD_PREVIEW_MS = 3000;
const DUEL_TRAY_HEIGHT = 176;

/** "General Viper" -> avatar_viper, matching the generated commander portraits. */
export const avatarKey = (name: string): string => `avatar_${(name.split(' ').pop() ?? '').toLowerCase().replace(/[^a-z]/g, '')}`;


type Aim = { half: Half; pos: Point };

export class GameScene extends Phaser.Scene {
  private data_!: GameSceneData;
  private match!: Match;
  private duel = false;
  private fields: Record<Half, Phaser.GameObjects.Container> | undefined;
  private unitLayers!: Record<Half, Phaser.GameObjects.Container>;
  private aimLayers!: Record<Half, Phaser.GameObjects.Container>;
  private masks!: Record<Half, Phaser.Display.Masks.GeometryMask>;
  private headers: Record<Half, SectorHeader> | undefined;
  private trays: Partial<Record<Side, Tray>> = {};
  private selected: Record<Side, UnitType | undefined> = { P1: 'tank', P2: 'tank' };
  private radarMode = false;
  private inputOpen = false;
  private aiming = false;
  private timerEvent: Phaser.Time.TimerEvent | undefined;
  private timeLeft = PLACEMENT_TURN_SECONDS;
  private timerRing!: Phaser.GameObjects.Graphics;
  private timerText!: Phaser.GameObjects.Text;
  private turnText!: Phaser.GameObjects.Text;
  private toastText: Phaser.GameObjects.Container | undefined;
  private foldButton: GameButton | undefined;
  private hingeLabel: Phaser.GameObjects.Text | undefined;
  private rng: () => number = Math.random;
  private playerLoadout: Loadout = DEFAULT_LOADOUT;
  private folded = false;
  /** The side drawn on the bottom half: P1 vs bot and face to face; your own side online. */
  private me: Side = 'P1';
  private online: GcMatch | undefined;
  /** Whether Game Center currently says it is this device's turn. */
  private gcMyTurn = false;
  /** A local placement that hasn't been sent to Game Center yet. */
  private unsent = false;
  private turnListener: PluginListenerHandle | undefined;

  constructor() {
    super('Game');
  }

  /** The side whose turn it is. Against the bot, only P1 ever acts through the UI. */
  private get actor(): Side {
    return this.duel || this.online ? this.match.turn : 'P1';
  }

  /** Your own side always sits on the bottom half; face to face, P2 owns the top half. */
  private halfOf(side: Side): Half {
    return side === this.me ? 'bottom' : 'top';
  }

  init(data: GameSceneData): void {
    this.data_ = data;
    this.duel = data.mode === 'local';
    setLayout(this.duel ? 'duel' : 'standard');
    // Bot games use your Armory levels and skill inventory; face-to-face games are always an even fight.
    this.playerLoadout = this.duel ? DEFAULT_LOADOUT : playerLoadout(loadProfile());
    const enemyLoadout = this.duel ? DEFAULT_LOADOUT : botLoadout(data.difficulty, this.playerLoadout.levels);
    this.online = data.online;
    this.me = data.online ? localSideOf(data.online) : 'P1';
    this.gcMyTurn = data.online?.isMyTurn ?? false;
    this.unsent = false;
    if (data.online) {
      // Online games are an even fight: everyone plays at level 1 with one of each skill.
      this.playerLoadout = DEFAULT_LOADOUT;
      const state = decodeState(data.online.data);
      this.match = state ? Match.fromState(state) : new Match('online', { P1: DEFAULT_LOADOUT, P2: DEFAULT_LOADOUT }, Math.random() < 0.5 ? 'P1' : 'P2');
    } else {
      this.match = data.staged ?? new Match(data.mode, { P1: this.playerLoadout, P2: enemyLoadout }, Math.random() < 0.5 ? 'P1' : 'P2');
    }
    this.selected = { P1: 'tank', P2: 'tank' };
    this.radarMode = false;
    this.inputOpen = false;
    this.aiming = false;
    this.trays = {};
    this.fields = undefined;
    this.headers = undefined;
    this.hingeLabel = undefined;
    this.foldButton = undefined;
    this.folded = false;
  }

  create(): void {
    sfx.music('placement');
    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.cameras.main.fadeIn(300);
    this.buildBoard();
    if (!this.duel) this.buildTopBar();
    this.buildTimer();
    this.buildTrays();
    this.bindInput();
    this.renderArmies();
    this.refreshHud();
    void this.listenForTurns();
    void this.nextTurn();
  }

  // ---------- Board ----------

  private buildBoard(): void {
    const fields = { top: buildFieldHalf(this, 'top', otherSide(this.me)), bottom: buildFieldHalf(this, 'bottom', this.me) };
    this.fields = fields;
    this.unitLayers = { top: this.add.container(0, 0), bottom: this.add.container(0, 0) };
    this.aimLayers = { top: this.add.container(0, 0), bottom: this.add.container(0, 0) };
    (['top', 'bottom'] as const).forEach((h) => fields[h].add([this.unitLayers[h], this.aimLayers[h]]).setDepth(1));
    this.masks = { top: sectorMask(this, 'top'), bottom: sectorMask(this, 'bottom') };
    if (!this.duel) {
      this.headers = {
        top: buildSectorHeader(this, otherSide(this.me), LAYOUT.topBarHeight + LAYOUT.headerHeight / 2, 'ENEMY SECTOR'),
        bottom: buildSectorHeader(this, this.me, LAYOUT.trayY - LAYOUT.headerHeight / 2, 'YOUR SECTOR'),
      };
      this.headers.top.container.setDepth(4);
      this.headers.bottom.container.setDepth(4);
    }
    buildHinge(this).setDepth(5);
    this.hingeLabel = label(this, GAME_WIDTH / 2, LAYOUT.hingeY, '', { size: 14, color: '#ffd38a' }).setDepth(6);
  }

  /** Hidden units stay invisible until radar exposes them; face to face they are hidden from both players. */
  private isVisible(u: PlacedUnit): boolean {
    if (!u.hidden) return true;
    if (this.match.players[otherSide(u.side)].revealed.has(u.id)) return true;
    return !this.duel && u.side === this.me;
  }

  private renderArmies(): void {
    (['top', 'bottom'] as const).forEach((h) => this.unitLayers[h].removeAll(true));
    (['P1', 'P2'] as const).forEach((side) => {
      const bunker = this.match.players[side].bunker;
      const bunkerShown = this.duel || side === this.me || this.match.enemyBunkerVisible(this.me);
      if (bunker && bunkerShown) {
        const tag = this.duel ? `PLAYER ${side === 'P1' ? 1 : 2} BUNKER` : side === this.me ? 'MAIN BUNKER' : 'ENEMY BUNKER';
        this.spawnView(bunker.pos, this.halfOf(side), { side, kind: 'bunker' }, bunker.shielded).setNameTag(tag);
      }
    });
    this.match.units.filter((u) => this.isVisible(u)).forEach((u) => {
      this.spawnView(u.pos, this.halfOf(u.side), { side: u.side, kind: u.type, hidden: u.hidden, boosted: u.boosted });
    });
    this.sortLayers();
    this.refreshHeaders();
  }

  private spawnView(pos: Point, half: Half, look: ConstructorParameters<typeof UnitView>[3], shielded = false): UnitView {
    const p = localPos(pos, half);
    const view = new UnitView(this, p.x, p.y, look, facingFor(pos.x, this.facingTargetX(look.side), half));
    view.setName(`${Math.round(pos.x)},${Math.round(pos.y)}`);
    view.showRange(look.kind !== 'bunker', 0.8).setRangeMask(this.masks[half]);
    this.unitLayers[half].add(view);
    if (shielded) view.setShield(true);
    return view;
  }

  /** Units turn toward the opposing bunker once it is known, otherwise toward the middle of the field. */
  private facingTargetX(side: Side): number {
    const opposing = this.match.players[otherSide(side)].bunker;
    const known = this.duel || side !== this.me || this.match.enemyBunkerVisible(this.me);
    return opposing && known ? opposing.pos.x : FIELD.width / 2;
  }

  private sortLayers(): void {
    (['top', 'bottom'] as const).forEach((h) => this.unitLayers[h].sort('y'));
  }

  private refreshHeaders(): void {
    if (!this.headers) return;
    const hpText = (side: Side): string => {
      const b = this.match.players[side].bunker;
      if (!b || (side !== this.me && !this.match.enemyBunkerVisible(this.me))) return '';
      const max = Math.round(BUNKER.hp * levelMultiplier(b.level));
      return `${max}/${max}${b.shielded ? ' +SHIELD' : ''}`;
    };
    const enemy = otherSide(this.me);
    this.headers.top.setStats(hpText(enemy), `UNITS ${this.match.ownUnits(enemy).length}/${DECK_SIZE}`);
    this.headers.bottom.setStats(hpText(this.me), `UNITS ${this.match.ownUnits(this.me).length}/${DECK_SIZE}`);
  }

  // ---------- HUD ----------

  private buildTopBar(): void {
    const g = this.add.graphics().setDepth(8);
    g.fillStyle(COLORS.bgDeep, 1).fillRect(0, 0, GAME_WIDTH, LAYOUT.topBarHeight);
    g.lineStyle(2, COLORS.cyan, 0.25).lineBetween(0, LAYOUT.topBarHeight - 1, GAME_WIDTH, LAYOUT.topBarHeight - 1);

    const name = this.online ? opponentAlias(this.online) : this.data_.opponent.name;
    this.add.image(42, 38, pickTexture(this, avatarKey(name), 'mortar_P2')).setDisplaySize(56, 56).setDepth(8);
    this.add.graphics().setDepth(8).lineStyle(2, TEAM.P2.main, 1).strokeRoundedRect(13, 9, 58, 58, 6);
    label(this, 82, 26, name.toUpperCase(), { size: 19, align: 'left' }).setDepth(8);
    this.add.image(92, 54, pickTexture(this, 'icon_trophy')).setDisplaySize(22, 22).setDepth(8);
    label(this, 106, 54, `${this.data_.opponent.trophies}`, { size: 15, align: 'left', color: '#ffd38a' }).setDepth(8);

    const soundKey = (): string => pickTexture(this, sfx.muted ? 'icon_sound_off' : 'icon_sound_on', sfx.muted ? 'icon_mute' : 'icon_sound');
    const sound = this.add.image(GAME_WIDTH - 98, 38, soundKey()).setDisplaySize(40, 40).setDepth(8).setInteractive({ useHandCursor: true });
    sound.on('pointerup', () => {
      sfx.unlock();
      sfx.setMuted(!sfx.muted);
      sound.setTexture(soundKey()).setDisplaySize(40, 40);
    });
    this.addQuitButton(GAME_WIDTH - 36, 38, 8);
  }

  private addQuitButton(x: number, y: number, depth: number): void {
    const quit = label(this, x, y, 'X', { size: 28, color: '#ff8080' }).setDepth(depth).setInteractive({ useHandCursor: true });
    quit.on('pointerup', () => {
      sfx.click();
      this.timerEvent?.remove();
      this.scene.start('Menu');
    });
  }

  /** Vs bot the timer lives in the top bar; face to face it sits on the hinge between both players. */
  private buildTimer(): void {
    const at = this.duel ? { x: 70, y: LAYOUT.hingeY } : { x: GAME_WIDTH / 2, y: 32 };
    this.timerRing = this.add.graphics().setDepth(9);
    this.timerText = label(this, at.x, at.y, '', { size: 22 }).setDepth(9);
    this.turnText = label(this, GAME_WIDTH / 2, this.duel ? LAYOUT.hingeY : 64, '', { size: 14, color: hex(COLORS.cyan) }).setDepth(9);
    if (this.duel) this.addQuitButton(GAME_WIDTH - 30, LAYOUT.hingeY, 9);
  }

  private buildTrays(): void {
    const handlers = (side: Side) => ({
      onCard: (type: UnitType, p: Phaser.Input.Pointer) => this.onCardDown(side, type, p),
      onSkill: (skill: SkillType) => this.onSkill(side, skill),
    });
    if (this.duel) {
      this.trays.P2 = new Tray(this, DUEL_TRAY_HEIGHT / 2, DUEL_TRAY_HEIGHT, 'P2', true, handlers('P2')).setDepth(9);
      this.trays.P1 = new Tray(this, GAME_HEIGHT - DUEL_TRAY_HEIGHT / 2, DUEL_TRAY_HEIGHT, 'P1', false, handlers('P1')).setDepth(9);
      return;
    }
    const height = GAME_HEIGHT - LAYOUT.trayY;
    this.trays[this.me] = new Tray(this, LAYOUT.trayY + height / 2, height, this.me, false, handlers(this.me)).setDepth(9);
  }

  private refreshHud(): void {
    (['P1', 'P2'] as const).forEach((side) => {
      this.trays[side]?.refresh({
        player: this.match.players[side],
        selected: this.selected[side],
        radarMode: this.radarMode && this.actor === side,
        bunkerPhase: this.match.phase === 'bunker',
        active: this.inputOpen && this.actor === side,
      });
    });
    this.refreshHeaders();
  }

  /** Messages appear by the acting player's tray, turned toward them. */
  private toast(text: string, color: number = COLORS.white, side: Side = this.actor): void {
    this.toastText?.destroy();
    const flip = this.duel && side === 'P2';
    const y = flip ? DUEL_TRAY_HEIGHT + 40 : LAYOUT.trayY - (this.duel ? 40 : 74);
    const c = this.add.container(GAME_WIDTH / 2, y).setDepth(500).setAngle(flip ? 180 : 0);
    const t = label(this, 0, 0, text, { size: 18, color: hex(color), wrap: 640 });
    const bg = this.add.rectangle(0, 0, Math.min(690, t.width + 36), t.height + 16, 0x000000, 0.8).setStrokeStyle(1, color, 0.5);
    c.add([bg, t]);
    c.setAlpha(0);
    this.toastText = c;
    this.tweens.add({ targets: c, alpha: 1, duration: 140 });
    this.tweens.add({ targets: c, alpha: 0, delay: 2300, duration: 300, onComplete: () => c.destroy() });
  }

  // ---------- Turn flow ----------

  private async nextTurn(): Promise<void> {
    this.refreshHud();
    if (this.match.phase === 'ready') {
      this.readyToFold();
      return;
    }
    if (this.online) {
      await this.onlineTurn();
      return;
    }
    if (!this.duel && this.match.turn === 'P2') {
      await this.botTurn();
      return;
    }
    await this.startHumanTurn();
  }

  // ---------- Online (Game Center turn-based) ----------

  /** Send finished local moves to Game Center, then either keep playing (still your turn) or wait. */
  private async onlineTurn(): Promise<void> {
    const online = this.online;
    if (!online) return;
    const stillMine = this.match.turn === this.me && this.match.phase !== 'ready';
    if (this.unsent && !stillMine) {
      try {
        const res = await FoldNative.endTurn({ matchId: online.matchId, data: encodeState(this.match.toState()) });
        this.online = res.match;
        this.unsent = false;
        this.gcMyTurn = false;
      } catch {
        this.toast('Could not reach Game Center — your move will be sent when you are back online', COLORS.danger, this.me);
        this.time.delayedCall(4000, () => void this.onlineTurn());
        return;
      }
    }
    if (this.match.phase === 'ready') {
      this.readyToFold();
      return;
    }
    if (stillMine) {
      await this.startHumanTurn();
      return;
    }
    this.turnText.setText(`WAITING FOR ${opponentAlias(this.online ?? online).toUpperCase()}`);
    this.refreshHud();
    this.toast("Move sent. Game Center will notify you when it's your turn.", COLORS.cyan, this.me);
  }

  private async listenForTurns(): Promise<void> {
    if (!this.online) return;
    const matchId = this.online.matchId;
    this.turnListener = await FoldNative.addListener('turnEvent', ({ match }) => {
      if (match.matchId === matchId) void this.applyRemote(match);
    });
    // The second player to fold ends the match, so the waiting phone hears about it as a match end.
    const ended = await FoldNative.addListener('matchEnded', ({ match }) => {
      if (match.matchId === matchId) void this.applyRemote(match);
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      void this.turnListener?.remove();
      void ended.remove();
    });
  }

  /** The opponent moved: load their state, show what they did, and hand control back if it's our turn. */
  private async applyRemote(match: GcMatch): Promise<void> {
    const state = decodeState(match.data);
    if (!state) return;
    const before = new Set(this.match.units.map((u) => u.id));
    const wasBunkerPhase = this.match.phase === 'bunker';
    this.online = match;
    this.gcMyTurn = match.isMyTurn;
    this.match = Match.fromState(state);
    if (this.folded) {
      // We already folded and were waiting: start as soon as the opponent's fold arrives.
      this.match.markFolded(this.me);
      if (this.match.bothFolded) this.startBattle(foldSensor.current === 'folded');
      return;
    }
    this.renderArmies();
    if (wasBunkerPhase && this.match.phase !== 'bunker') await this.revealBunkers();
    this.match.units.filter((u) => !before.has(u.id)).forEach((u) => this.announcePlacement(u));
    await wait(this, 400);
    void this.nextTurn();
  }

  /** Both armies are down. Online, a reopened match may already have one or both folds recorded. */
  private readyToFold(): void {
    const online = this.online;
    if (online && this.match.bothFolded) {
      this.folded = true;
      this.startBattle(foldSensor.current === 'folded');
      return;
    }
    if (online && this.match.folded[this.me]) {
      this.folded = true;
      this.showWaitingForFold(opponentAlias(online));
      return;
    }
    this.showFoldButton();
    if (online && this.match.folded[otherSide(this.me)]) {
      this.toast(`${opponentAlias(online).toUpperCase()} has folded. Fold your phone to start the battle!`, COLORS.gold, this.me);
    }
  }

  private async startHumanTurn(): Promise<void> {
    const side = this.actor;
    const bunkerPhase = this.match.phase === 'bunker';
    const flip = this.duel && side === 'P2';
    const who = this.duel ? `PLAYER ${side === 'P1' ? 1 : 2}` : 'YOUR TURN';
    sfx.turnStart();
    await banner(
      this,
      bunkerPhase ? (this.duel ? `${who}: PLACE BUNKER` : 'HIDE YOUR BUNKER') : who,
      bunkerPhase ? COLORS.gold : TEAM[side].main,
      LAYOUT.hingeY,
      bunkerPhase && !this.duel ? 'The enemy sees it once both are placed' : undefined,
      flip,
    );
    if (!bunkerPhase && this.match.players[side].remaining[this.selected[side] ?? 'tank'] === 0) this.selectFirstAvailable(side);
    this.inputOpen = true;
    this.turnText.setText(this.duel ? '' : bunkerPhase ? 'PLACE BUNKER' : who);
    this.hingeLabel?.setText(bunkerPhase ? '' : `DEPLOYED ${this.match.units.length}/${DECK_SIZE * 2}`);
    this.refreshHud();
    this.startTimer();
    if (this.data_.hover) {
      this.selected[side] = this.data_.hoverKind ?? 'mortar';
      this.refreshHud();
      this.drawAim({ half: this.halfOf(side), pos: this.data_.hover });
    }
  }

  private startTimer(): void {
    this.timerEvent?.remove();
    this.timeLeft = PLACEMENT_TURN_SECONDS;
    this.drawTimer();
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      repeat: PLACEMENT_TURN_SECONDS - 1,
      callback: () => {
        this.timeLeft--;
        this.drawTimer();
        if (this.timeLeft <= 5 && this.timeLeft > 0) sfx.tick(true);
        if (this.timeLeft === 0) this.autoPlace();
      },
    });
  }

  private drawTimer(): void {
    const g = this.timerRing;
    const x = this.timerText.x;
    const y = this.timerText.y;
    g.clear();
    if (!this.inputOpen) {
      this.timerText.setText('');
      return;
    }
    const color = this.timeLeft <= 5 ? COLORS.danger : this.duel ? TEAM[this.actor].main : COLORS.cyan;
    g.fillStyle(0x000000, 0.85).fillCircle(x, y, 24);
    g.lineStyle(2, COLORS.steel, 1).strokeCircle(x, y, 24);
    g.lineStyle(4, color, 1);
    g.beginPath();
    g.arc(x, y, 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (this.timeLeft / PLACEMENT_TURN_SECONDS), false);
    g.strokePath();
    this.timerText.setText(`${this.timeLeft}`).setAngle(this.duel && this.actor === 'P2' ? 180 : 0);
  }

  private stopTurn(): void {
    this.inputOpen = false;
    this.radarMode = false;
    this.aiming = false;
    this.timerEvent?.remove();
    this.timerEvent = undefined;
    this.drawTimer();
    this.clearAim();
  }

  private autoPlace(): void {
    if (!this.inputOpen) return;
    const side = this.actor;
    this.toast("Time's up! Auto-deployed.", COLORS.orange);
    if (this.match.phase === 'bunker') {
      this.placeBunker(chooseBunkerPos(Math.random));
      return;
    }
    const type = UNIT_ORDER.find((t) => this.match.players[side].remaining[t] > 0);
    if (!type) return;
    for (let i = 0; i < 60; i++) {
      const p = { x: 40 + Math.random() * (FIELD.width - 80), y: 40 + Math.random() * (FIELD.height - 80) };
      if (this.match.canPlaceUnit(side, type, p)) {
        this.placeUnit(type, p);
        return;
      }
    }
  }

  // ---------- Bot ----------

  private async botTurn(): Promise<void> {
    this.turnText.setText(`${this.data_.opponent.name.toUpperCase()} IS AIMING...`);
    await wait(this, 650 + Math.random() * 650);

    if (this.match.phase === 'bunker') {
      this.match.placeBunker('P2', chooseBunkerPos(this.rng));
      this.toast('Enemy bunker hidden. Bunkers revealed!', COLORS.gold, 'P1');
      await this.revealBunkers();
      void this.nextTurn();
      return;
    }

    const radarBefore = this.match.players.P2.revealed.size;
    const summary = takeBotTurn(this.match, 'P2', this.data_.difficulty, this.rng);
    if (summary.radarCenter) {
      await this.radarSweep(summary.radarCenter, 'bottom');
      const spotted = this.match.players.P2.revealed.size - radarBefore;
      this.toast(spotted > 0 ? `Enemy RADAR spotted ${spotted} of your hidden units!` : 'Enemy RADAR found nothing.', COLORS.danger, 'P1');
    }
    if (summary.shielded) {
      this.toast('Enemy raised a bunker SHIELD!', COLORS.blueUi, 'P1');
      sfx.shieldUp();
    }
    this.announcePlacement(summary.unit);
    await wait(this, 450);
    void this.nextTurn();
  }

  /** Redraws, then plays the drop-in on the new unit — or a purple poof if it was hidden. */
  private announcePlacement(unit: PlacedUnit): void {
    this.renderArmies();
    this.refreshHud();
    const half = this.halfOf(unit.side);
    const at = localPos(unit.pos, half);
    if (!this.isVisible(unit)) {
      sfx.reveal();
      purplePoof(this, this.unitLayers[half], at.x, at.y);
      const msg = this.duel ? `PLAYER ${unit.side === 'P1' ? 1 : 2} deployed a HIDDEN unit` : 'Enemy deployed a HIDDEN unit... watch out!';
      this.toast(msg, COLORS.purple, this.duel ? otherSide(unit.side) : this.me);
      return;
    }
    const view = this.findView(half, unit.pos);
    if (view) this.deployEffect(view, half);
    if (unit.hidden) purplePoof(this, this.unitLayers[half], at.x, at.y);
  }

  private findView(half: Half, pos: Point): UnitView | undefined {
    const name = `${Math.round(pos.x)},${Math.round(pos.y)}`;
    return this.unitLayers[half].list.find((o): o is UnitView => o instanceof UnitView && o.name === name);
  }

  private async revealBunkers(): Promise<void> {
    await wait(this, 300);
    this.renderArmies();
    const enemyBunker = this.match.enemyBunkerVisible(this.me);
    if (!enemyBunker) return;
    const view = this.findView('top', enemyBunker.pos);
    if (view) {
      this.deployEffect(view, 'top', 1.4);
      sfx.slam();
    }
    sfx.voice('ready');
    await banner(this, 'BUNKERS REVEALED', COLORS.gold, LAYOUT.hingeY, 'Remember where it is — after the fold, aim for it');
  }

  /** Hologram drop-in: deploy-beam sheet (or a code beam), then the unit lands. */
  private deployEffect(view: UnitView, half: Half, scale = 1): void {
    const layer = this.unitLayers[half];
    const color = TEAM[view.look.side].light;
    const sheet = playSheet(this, layer, 'fx_deploy_sheet', view.x, view.y - 30 * scale, { size: 140 * scale, frameRate: 30, add: true, tint: color, alpha: 0.8 });
    if (!sheet) {
      const beam = this.add.rectangle(view.x, view.y - 120 * scale, 18 * scale, 240 * scale, color, 0.7).setBlendMode(Phaser.BlendModes.ADD);
      layer.add(beam);
      this.tweens.add({ targets: beam, scaleX: 0, alpha: 0, duration: 340, ease: 'Cubic.In', onComplete: () => beam.destroy() });
    }
    const y = view.y;
    view.setY(y - 40).setAlpha(0);
    this.tweens.add({ targets: view, y, alpha: 1, duration: 240, ease: 'Cubic.Out' });
    this.time.delayedCall(150, () => {
      sparks(this, layer, view.x, y, color, 8);
      sfx.place();
      haptic(15);
    });
  }

  // ---------- Input: press, drag to aim, release to deploy ----------

  private bindInput(): void {
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      sfx.unlock();
      if (!this.inputOpen || !this.inBoard(p.y)) return;
      const own = this.halfOf(this.actor);
      const touched: Half = p.y > LAYOUT.hingeY ? 'bottom' : 'top';
      if (this.radarMode) {
        const hit = this.aimAt(p);
        if (hit && hit.half !== own) void this.useRadar(hit.pos);
        else this.toast('Tap the ENEMY sector to scan it', COLORS.green);
        return;
      }
      if (touched !== own) {
        this.toast('Deploy in YOUR sector', COLORS.orange);
        sfx.invalid();
        return;
      }
      this.aiming = true;
      this.drawAim(this.aimAt(p));
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.aiming) this.drawAim(this.aimAt(p));
    });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (!this.aiming) return;
      const aim = this.aimAt(p);
      this.aiming = false;
      this.clearAim();
      if (!aim || aim.half !== this.halfOf(this.actor) || !this.inputOpen) return;
      this.tryPlace(aim.pos);
    });
  }

  private inBoard(y: number): boolean {
    const top = this.duel ? DUEL_TRAY_HEIGHT : LAYOUT.topBarHeight + LAYOUT.headerHeight;
    return y > top && y < LAYOUT.trayY - (this.duel ? 0 : LAYOUT.headerHeight);
  }

  /** The aim point floats "up" from the acting player's point of view — toward the hinge. */
  private aimAt(p: Phaser.Input.Pointer): Aim | undefined {
    const offset = p.wasTouch && this.aiming ? TOUCH_AIM_OFFSET : 0;
    const y = this.halfOf(this.actor) === 'bottom' ? p.y - offset : p.y + offset;
    const half: Half = y > LAYOUT.hingeY ? 'bottom' : 'top';
    const pos = toField(p.x, y, half);
    return pos ? { half, pos } : undefined;
  }

  private onCardDown(side: Side, type: UnitType, p: Phaser.Input.Pointer): void {
    sfx.unlock();
    if (!this.inputOpen || this.actor !== side || this.match.phase !== 'units') return;
    if (this.match.players[side].remaining[type] <= 0) {
      sfx.invalid();
      return;
    }
    this.radarMode = false;
    this.selected[side] = type;
    sfx.select();
    this.toast(`${UNITS[type].name.toUpperCase()} · LV ${this.match.players[side].levels[type]} — ${UNITS[type].blurb}`);
    this.aiming = true;
    this.drawAim(this.aimAt(p));
    this.refreshHud();
  }

  private onSkill(side: Side, skill: SkillType): void {
    sfx.unlock();
    if (!this.inputOpen || this.actor !== side || this.match.phase !== 'units') return;
    const player = this.match.players[side];
    const info = SKILL_INFO[skill];
    const armedAlready = (skill === 'hide' || skill === 'boost') && player.armed[skill];
    if (player.skillsLeft[skill] <= 0 && !armedAlready && !(skill === 'radar' && this.radarMode)) {
      sfx.invalid();
      this.toast(`No ${info.name} left`, COLORS.danger);
      return;
    }
    if (skill === 'hide' || skill === 'boost') {
      this.match.armSkill(side, skill);
      sfx.select();
      this.toast(player.armed[skill] ? `${info.name.toUpperCase()} ARMED — ${info.blurb}` : `${info.name} cancelled`, COLORS.purple);
    } else if (skill === 'foldpreview') {
      this.match.useFoldPreview(side);
      sfx.radar();
      this.showFoldPreview(side);
      this.toast('FOLD PREVIEW — this is where the enemy lands on your sector', COLORS.cyan);
    } else if (skill === 'radar') {
      this.radarMode = !this.radarMode;
      sfx.select();
      this.toast(this.radarMode ? 'RADAR — tap the enemy sector to scan' : 'Radar cancelled', COLORS.green);
    } else {
      if (!player.bunker || player.bunker.shielded) return;
      this.match.useShield(side);
      sfx.shieldUp();
      haptic(20);
      this.toast(`SHIELD UP — ${info.blurb}`, COLORS.blueUi);
      this.renderArmies();
    }
    this.refreshHud();
  }

  /** Paid aim help: mirrored enemy positions flicker onto your own sector, then fade. */
  private showFoldPreview(side: Side): void {
    const enemy = otherSide(side);
    const own = this.halfOf(side);
    const targets: { pos: Point; kind: UnitType | 'bunker' }[] = this.match.units
      .filter((u) => u.side === enemy && this.isVisible(u))
      .map((u) => ({ pos: u.pos, kind: u.type }));
    const bunker = this.match.players[enemy].bunker;
    if (bunker && (this.duel || this.match.enemyBunkerVisible(side))) targets.push({ pos: bunker.pos, kind: 'bunker' });
    targets.forEach(({ pos, kind }, i) => {
      const p = localPos(pos, own);
      const ghost = new UnitView(this, p.x, p.y, { side: enemy, kind }, 'sw');
      const ring = this.add.graphics();
      ring.lineStyle(2, TEAM[enemy].main, 1).strokeCircle(p.x, p.y, radiusOf(kind));
      ring.fillStyle(TEAM[enemy].main, 0.18).fillCircle(p.x, p.y, radiusOf(kind));
      ghost.setAlpha(0);
      ring.setAlpha(0);
      this.unitLayers[own].add([ring, ghost]);
      this.tweens.add({ targets: [ghost, ring], alpha: 0.65, delay: i * 40, duration: 200 });
      this.tweens.add({
        targets: [ghost, ring],
        alpha: 0,
        delay: FOLD_PREVIEW_MS,
        duration: 400,
        onComplete: () => {
          ghost.destroy();
          ring.destroy();
        },
      });
    });
  }

  private tryPlace(pos: Point): void {
    const side = this.actor;
    if (this.match.phase === 'bunker') {
      if (!this.match.canPlaceBunker(pos)) {
        this.rejectAim();
        return;
      }
      this.placeBunker(pos);
      return;
    }
    const type = this.selected[side];
    if (!type || !this.match.canPlaceUnit(side, type, pos)) {
      this.rejectAim();
      return;
    }
    if (type === 'bomb' && this.mineHitsOwnBunker(side, pos)) {
      haptic([20, 60, 20]);
      this.toast('Warning: this mine will blast your own bunker if it goes off!', COLORS.orange);
    }
    this.placeUnit(type, pos);
  }

  /** A triggered mine blasts everything within MINE_BLAST.radius, including its owner's bunker. */
  private mineHitsOwnBunker(side: Side, pos: Point): boolean {
    const bunker = this.match.players[side].bunker;
    return !!bunker && distance(pos, bunker.pos) - BUNKER.bodyRadius <= MINE_BLAST.radius;
  }

  private rejectAim(): void {
    sfx.invalid();
    haptic([10, 40, 10]);
    this.toast('Too close to your own unit or the edge', COLORS.danger);
  }

  private placeBunker(pos: Point): void {
    const side = this.actor;
    this.stopTurn();
    this.match.placeBunker(side, pos);
    this.unsent = true;
    const half = this.halfOf(side);
    const view = this.spawnView(pos, half, { side, kind: 'bunker' });
    view.setNameTag(this.duel ? `PLAYER ${side === 'P1' ? 1 : 2} BUNKER` : 'MAIN BUNKER');
    this.deployEffect(view, half, 1.4);
    this.sortLayers();
    this.time.delayedCall(600, () => void this.nextTurn());
  }

  private placeUnit(type: UnitType, pos: Point): void {
    const side = this.actor;
    this.stopTurn();
    const unit = this.match.placeUnit(side, type, pos);
    this.unsent = true;
    this.announcePlacement(unit);
    if (unit.boosted) {
      const p = localPos(pos, this.halfOf(side));
      this.time.delayedCall(200, () => sparks(this, this.unitLayers[this.halfOf(side)], p.x, p.y, COLORS.gold, 12));
    }
    if (this.match.players[side].remaining[type] === 0) this.selectFirstAvailable(side);
    this.refreshHud();
    this.time.delayedCall(550, () => void this.nextTurn());
  }

  private selectFirstAvailable(side: Side): void {
    this.selected[side] = UNIT_ORDER.find((t) => this.match.players[side].remaining[t] > 0);
  }

  private async useRadar(center: Point): Promise<void> {
    const side = this.actor;
    this.radarMode = false;
    this.inputOpen = false;
    const found = this.match.useRadar(side, center);
    const enemyHalf = this.halfOf(otherSide(side));
    await this.radarSweep(center, enemyHalf);
    this.renderArmies();
    found.forEach((u) => {
      const v = this.findView(enemyHalf, u.pos);
      if (v) purplePoof(this, this.unitLayers[enemyHalf], v.x, v.y);
    });
    this.toast(found.length > 0 ? `RADAR exposed ${found.length} hidden unit${found.length > 1 ? 's' : ''}` : 'RADAR: area clear', found.length > 0 ? COLORS.gold : COLORS.green);
    this.inputOpen = true;
    this.refreshHud();
  }

  private radarSweep(center: Point, half: Half): Promise<void> {
    sfx.radar();
    const g = this.add.graphics();
    this.fields?.[half].add(g);
    const { x, y } = localPos(center, half);
    if (this.fields) sparkBurst(this, this.fields[half], x, y, 0x7dff8a, RADAR_RADIUS * 1.2);
    return new Promise((resolve) => {
      this.tweens.addCounter({
        from: 0,
        to: 1,
        duration: 900,
        onUpdate: (tw) => {
          const t = tw.getValue() ?? 0;
          g.clear();
          g.fillStyle(0x30ff60, 0.1 * (1 - t * 0.5)).fillCircle(x, y, RADAR_RADIUS);
          g.lineStyle(2, 0x7dff8a, 1 - t * 0.6).strokeCircle(x, y, RADAR_RADIUS);
          g.lineStyle(2, 0x7dff8a, 0.8).strokeCircle(x, y, RADAR_RADIUS * t);
          const a = t * Math.PI * 4;
          g.lineStyle(2, 0x7dff8a, 0.7).lineBetween(x, y, x + Math.cos(a) * RADAR_RADIUS, y + Math.sin(a) * RADAR_RADIUS);
        },
        onComplete: () => {
          g.destroy();
          resolve();
        },
      });
    });
  }

  // ---------- Aim preview: own sector only, never a hint of where it lands on the enemy side ----------

  private clearAim(): void {
    this.aimLayers.top.removeAll(true);
    this.aimLayers.bottom.removeAll(true);
  }

  private drawAim(aim: Aim | undefined): void {
    this.clearAim();
    const side = this.actor;
    if (!aim || aim.half !== this.halfOf(side)) return;
    const bunkerPhase = this.match.phase === 'bunker';
    const kind: UnitType | 'bunker' | undefined = bunkerPhase ? 'bunker' : this.selected[side];
    if (!kind) return;
    const valid = kind === 'bunker' ? this.match.canPlaceBunker(aim.pos) : this.match.canPlaceUnit(side, kind, aim.pos);
    const p = localPos(aim.pos, aim.half);
    const color = valid ? TEAM[side].main : COLORS.danger;
    const ghost = new UnitView(this, p.x, p.y, { side, kind }, facingFor(aim.pos.x, this.facingTargetX(side), aim.half));
    ghost.setAlpha(0.6);
    const g = this.add.graphics();
    g.setMask(this.masks[aim.half]);
    if (kind !== 'bunker' && rangeOf(kind) > 0) {
      g.fillStyle(color, 0.08).fillCircle(p.x, p.y, rangeOf(kind));
      g.lineStyle(1.5, color, 0.7).strokeCircle(p.x, p.y, rangeOf(kind));
    }
    const r = radiusOf(kind);
    g.lineStyle(2, valid ? COLORS.gold : COLORS.danger, 1).strokeCircle(p.x, p.y, r);
    g.lineStyle(1.5, 0xffffff, 0.9);
    g.lineBetween(p.x - r - 10, p.y, p.x - r + 5, p.y);
    g.lineBetween(p.x + r - 5, p.y, p.x + r + 10, p.y);
    g.lineBetween(p.x, p.y - r - 10, p.x, p.y - r + 5);
    g.lineBetween(p.x, p.y + r - 5, p.x, p.y + r + 10);
    this.aimLayers[aim.half].add([g, ghost]);
    if (kind === 'bomb' && valid) this.drawMineBlast(aim, p, g);
  }

  /** Shows how far a mine's blast reaches; turns orange with a warning when it would catch your own bunker. */
  private drawMineBlast(aim: Aim, p: Point, g: Phaser.GameObjects.Graphics): void {
    const danger = this.mineHitsOwnBunker(this.actor, aim.pos);
    const color = danger ? COLORS.orange : 0xffffff;
    g.fillStyle(color, danger ? 0.14 : 0.04).fillCircle(p.x, p.y, MINE_BLAST.radius);
    for (let a = 0; a < 24; a++) {
      const from = (a / 24) * Math.PI * 2;
      g.lineStyle(danger ? 2.5 : 1.5, color, danger ? 0.95 : 0.45).beginPath().arc(p.x, p.y, MINE_BLAST.radius, from, from + Math.PI / 24).strokePath();
    }
    if (!danger) return;
    const flip = this.duel && this.actor === 'P2';
    const warning = this.add.container(p.x, p.y + (flip ? 1 : -1) * (MINE_BLAST.radius + 20)).setAngle(flip ? 180 : 0);
    const text = label(this, 0, 0, '⚠ BLAST HITS YOUR BUNKER', { size: 16, color: hex(COLORS.orange) });
    warning.add([this.add.rectangle(0, 0, text.width + 24, text.height + 10, 0x000000, 0.85).setStrokeStyle(1, COLORS.orange, 0.8), text]);
    this.aimLayers[aim.half].add(warning);
  }

  // ---------- Fold ----------

  private showFoldButton(): void {
    this.stopTurn();
    this.turnText.setText('');
    this.hingeLabel?.setText('');
    this.refreshHud();
    const btn = new GameButton(this, GAME_WIDTH / 2, LAYOUT.hingeY, 'FOLD & FIGHT', { width: 420, skin: 'fold', fontSize: 28, onClick: () => this.fold(false) });
    btn.setDepth(600).setScale(0);
    this.tweens.add({ targets: btn, scale: 1, duration: 360, ease: 'Back.Out' });
    this.foldButton = btn;
    this.showFoldPrompt();
    sfx.turnStart();
    // iPhone Duo: physically folding the phone starts the fight on the outer screen.
    foldSensor.arm();
    const stop = foldSensor.onChange((posture) => {
      if (posture === 'folded') this.fold(true);
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, stop);
  }

  /** "Fold your phone" hint with a little closing-book animation, on both halves in face-to-face mode. */
  private showFoldPrompt(): void {
    const sides: { y: number; flip: boolean }[] = [{ y: LAYOUT.hingeY + 120, flip: false }];
    if (this.duel) sides.push({ y: LAYOUT.hingeY - 120, flip: true });
    sides.forEach(({ y, flip }) => {
      const c = this.add.container(GAME_WIDTH / 2, y).setDepth(600).setAngle(flip ? 180 : 0);
      const bg = this.add.rectangle(0, 0, 520, 92, 0x000000, 0.75).setStrokeStyle(2, COLORS.gold, 0.6);
      const icon = this.add.graphics();
      const t = label(this, 40, -14, 'FOLD YOUR iPHONE DUO', { size: 22, color: hex(COLORS.gold) });
      const sub = label(this, 40, 18, 'The battle plays on the outer screen', { size: 15, color: '#cfe3ff' });
      c.add([bg, icon, t, sub]);
      this.tweens.addCounter({
        from: 0,
        to: 1,
        duration: 1400,
        repeat: -1,
        onUpdate: (tw) => {
          const k = Math.sin((tw.getValue() ?? 0) * Math.PI);
          icon.clear();
          icon.fillStyle(TEAM.P2.main, 0.9).fillRect(-215, -30, 34, 28);
          icon.fillStyle(TEAM.P1.main, 0.9).fillRect(-215, 2, 34, 28 * (1 - 2 * k));
          icon.lineStyle(2, 0xffffff, 0.9).lineBetween(-219, 0, -177, 0);
        },
      });
    });
  }

  private fold(physical: boolean): void {
    if (this.folded) return;
    this.folded = true;
    this.foldButton?.setEnabled(false);
    if (this.online) {
      void this.foldOnline(physical);
      return;
    }
    this.startBattle(physical);
  }

  /**
   * Online, the battle starts only when both players have folded. The first to fold waits on the folded
   * screen; whoever folds second starts the battle and ends the Game Center match, which starts it for the other.
   */
  private async foldOnline(physical: boolean): Promise<void> {
    const online = this.online;
    if (!online) return;
    this.match.markFolded(this.me);
    if (this.match.bothFolded) {
      this.startBattle(physical);
      return;
    }
    this.showWaitingForFold(opponentAlias(online));
    // Only the player holding the Game Center turn can send; otherwise our fold is matched when theirs arrives.
    if (!this.gcMyTurn) return;
    try {
      const res = await FoldNative.endTurn({ matchId: online.matchId, data: encodeState(this.match.toState()) });
      this.online = res.match;
      this.gcMyTurn = false;
    } catch {
      this.toast('Could not reach Game Center. Your fold will be sent when you are back online.', COLORS.danger, this.me);
      this.time.delayedCall(4000, () => this.folded && !this.match.bothFolded && void this.resendFold());
    }
  }

  private async resendFold(): Promise<void> {
    const online = this.online;
    if (!online || !this.gcMyTurn) return;
    try {
      this.online = (await FoldNative.endTurn({ matchId: online.matchId, data: encodeState(this.match.toState()) })).match;
      this.gcMyTurn = false;
    } catch {
      this.time.delayedCall(4000, () => void this.resendFold());
    }
  }

  /** Folded screen while the opponent still has to fold: just the board, dimmed, and who we are waiting for. */
  private showWaitingForFold(opponent: string): void {
    this.foldButton?.setVisible(false);
    const c = this.add.container(0, 0).setDepth(700);
    c.add(this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.55).setInteractive());
    const y = LAYOUT.hingeY;
    c.add(this.add.rectangle(GAME_WIDTH / 2, y, 600, 190, 0x05080c, 0.92).setStrokeStyle(2, COLORS.gold, 0.7));
    c.add(label(this, GAME_WIDTH / 2, y - 52, 'FOLDED', { size: 30, color: hex(COLORS.gold) }));
    const text = label(this, GAME_WIDTH / 2, y + 4, `Waiting for ${opponent.toUpperCase()} to fold`, { size: 21, wrap: 560 });
    c.add(text);
    c.add(label(this, GAME_WIDTH / 2, y + 52, 'The battle starts on both phones together', { size: 16, color: '#8fa3bf' }));
    let dots = 0;
    this.time.addEvent({
      delay: 450,
      loop: true,
      callback: () => text.setText(`Waiting for ${opponent.toUpperCase()} to fold${'.'.repeat((dots++ % 3) + 1)}`),
    });
    sfx.turnStart();
  }

  private startBattle(physical: boolean): void {
    const setup = this.match.battleSetup();
    // Free matches are counted when the fold starts the battle; online always needs the Full Game.
    if (!this.data_.staged && !this.online) {
      updateProfile((p) => {
        recordMatchStart(p, this.data_.mode);
        if (this.data_.mode === 'bot') consumeSkills(p, this.playerLoadout, this.match.players.P1.skillsLeft);
      });
    }
    const online = this.online
      ? { matchId: this.online.matchId, canEnd: this.gcMyTurn && !this.unsent, data: encodeState(this.match.toState()) }
      : undefined;
    const opponent = this.online ? { name: opponentAlias(this.online), trophies: 0 } : this.data_.opponent;
    this.scene.start('Battle', { setup, mode: this.data_.mode, opponent, difficulty: this.data_.difficulty, physicalFold: physical, localSide: this.me, online });
  }
}
