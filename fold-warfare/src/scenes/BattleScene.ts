import Phaser from 'phaser';
import { haptic, sfx } from '../audio/sfx';
import type { BotDifficulty } from '../core/ai';
import { initialHealth, resolveBattle } from '../core/battle';
import { FIELD, MINE_BLAST, UNITS } from '../core/balance';
import { distance } from '../core/geometry';
import { pickTexture } from '../art/assets';
import { playerAvatarKey } from '../art/avatar';
import { canStartMatch } from '../core/economy';
import type { MatchMode } from '../core/match';
import { coinReward, loadProfile, recordBattle, rollOpponent, saveProfile, trophyDelta, type Profile } from '../core/profile';
import { GC_IDS, submitTrophies, unlockAchievement } from '../platform/gamecenter';
import { FoldNative } from '../platform/native';
import { markRewarded } from '../platform/online';
import {
  bunkerId,
  otherSide,
  type BattleEvent,
  type BattleOutcome,
  type BattleReport,
  type Bunker,
  type Hit,
  type PlacedUnit,
  type Point,
  type Side,
  type TargetId,
} from '../core/types';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, LAYOUT, TEAM, hex, setLayout } from '../theme';
import { showPaywall } from '../ui/screen';
import { GameButton, label, panel, tweenAsync, wait } from '../ui/widgets';
import { buildFieldHalf, buildHinge, localPos } from '../view/field';
import { banner, callout, damageNumber, dustPuff, explosion, muzzleFlash, playSheet, purplePoof, shieldHit, shockwave, sparkBurst, sparks } from '../view/fx';
import { UnitView, facingFor, radiusOf } from '../view/UnitView';
import { avatarKey, unitArt } from './GameScene';

export type BattleSceneData = {
  setup: { units: PlacedUnit[]; bunkers: Record<Side, Bunker> };
  mode: MatchMode;
  opponent: { name: string; trophies: number };
  difficulty: BotDifficulty;
  /** Preview/dev only: fast-forward straight to the result screen. */
  skipToResult?: boolean;
  /** The player folded the iPhone Duo: the battle is now on the outer screen. */
  physicalFold?: boolean;
  /** Which side this device plays (online P2 sees their own army at the bottom). Defaults to P1. */
  localSide?: Side;
  /** Online match: `canEnd` when it is this player's Game Center turn, so they record the result. */
  online?: { matchId: string; canEnd: boolean; data: string };
};

/** After the fold the merged battlefield is zoomed so the 6-wide grid fills the phone. */
const ZOOM = 1.12;
const FIELD_CENTER_LOCAL_Y = -(LAYOUT.hingeHalf + FIELD.height / 2);
/** Vertical rhythm of the battle screen: enemy above the merged field, you below it. */
const BL = { enemyBar: 56, enemyRoster: 146, chips: 222, fieldCenter: 600, log: 904, allyRoster: 990, allyBar: 1086, speed: 1196 } as const;
/** iPhone Duo folded shut: the outer screen shows just the battlefield between the two HP bars. */
/** iPhone Duo folded shut: the outer screen is all playground, centred, with a little ground margin at the sides. */
const FOLDED_CENTER_Y = 640;
const FOLDED_ZOOM = 1.04;

type RosterItem = { container: Phaser.GameObjects.Container; icon: Phaser.GameObjects.Image; bar: Phaser.GameObjects.Graphics; side: Side };

const PHASE_BANNER: Record<string, { text: string; color: number; sub?: string }> = {
  reveal: { text: 'REVEAL', color: COLORS.purple, sub: 'Hidden units are exposed' },
  clash: { text: 'CRASH', color: COLORS.orange, sub: 'Higher level wins · equal levels destroy both' },
};

export class BattleScene extends Phaser.Scene {
  /** This device's side. */
  private get me(): Side {
    return this.data_.localSide ?? 'P1';
  }

  /** One human on this device (vs bot or online): show "YOU" vs the opponent instead of Player 1 / 2. */
  private get solo(): boolean {
    return this.data_.mode !== 'local';
  }

  private data_!: BattleSceneData;
  private report!: BattleReport;
  private maxHp = new Map<TargetId, number>();
  private views = new Map<TargetId, UnitView>();
  private unitPos = new Map<TargetId, Point>();
  private field!: Phaser.GameObjects.Container;
  private ground!: Phaser.GameObjects.Container;
  private unitLayer!: Phaser.GameObjects.Container;
  private fxLayer!: Phaser.GameObjects.Container;
  /** Screen HP bars; absent on the folded iPhone Duo, where each bunker's own bar inside the playground is enough. */
  private hpBars: Record<Side, { fill: Phaser.GameObjects.Graphics; text: Phaser.GameObjects.Text; container: Phaser.GameObjects.Container }> | undefined;
  private speedUp = false;
  private phaseChips = new Map<string, Phaser.GameObjects.Container>();
  private logText: Phaser.GameObjects.Text | undefined;
  private roster = new Map<TargetId, RosterItem>();

  constructor() {
    super('Battle');
  }

  init(data: BattleSceneData): void {
    this.data_ = data;
    setLayout('standard');
    this.views = new Map();
    this.unitPos = new Map();
    this.speedUp = false;
    this.phaseChips = new Map();
    this.logText = undefined;
    this.roster = new Map();
  }

  create(): void {
    sfx.music('battle');
    if (this.data_.physicalFold) this.fillOuterScreen();
    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.tweens.timeScale = 1;
    this.time.timeScale = 1;
    const { units, bunkers } = this.data_.setup;
    this.report = resolveBattle(units, bunkers);
    this.maxHp = initialHealth(units, bunkers);
    units.forEach((u) => this.unitPos.set(u.id, u.pos));
    (['P1', 'P2'] as const).forEach((s) => this.unitPos.set(bunkerId(s), bunkers[s].pos));
    void this.play();
  }

  /**
   * Folded iPhone Duo: cover the whole outer screen instead of letterboxing the 9:16 frame. Only empty ground
   * at the top and bottom is cropped; the playground and the result panel sit in the middle.
   */
  private fillOuterScreen(): void {
    document.body.classList.add('fullbleed');
    this.setScaleMode(Phaser.Scale.ENVELOP);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      document.body.classList.remove('fullbleed');
      this.setScaleMode(Phaser.Scale.FIT);
    });
  }

  /** Phaser reads the aspect mode from displaySize, which is only set at boot, so switch both. */
  private setScaleMode(mode: typeof Phaser.Scale.FIT | typeof Phaser.Scale.ENVELOP): void {
    this.scale.scaleMode = mode;
    this.scale.displaySize.setAspectMode(mode);
    requestAnimationFrame(() => this.scale.refresh());
  }

  private async play(): Promise<void> {
    if (this.data_.skipToResult) this.setSpeed(60);
    await this.foldSequence();
    this.buildHud();
    await this.playEvents(this.report.events);
    await wait(this, 700);
    this.phaseChips.forEach((_, p) => this.drawChip(p, 'done'));
    this.showResult(this.report.outcome);
  }

  private setSpeed(scale: number): void {
    this.tweens.timeScale = scale;
    this.time.timeScale = scale;
  }

  // ---------- Fold ----------

  private async foldSequence(): Promise<void> {
    const { units, bunkers } = this.data_.setup;
    // The phone was folded for real: the outer screen is one seamless playground, no frames or HUD.
    const folded = !!this.data_.physicalFold;
    const groundKey = pickTexture(this, 'env_ground_tile', 'field_bottom');
    const backdrop = this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, groundKey).setOrigin(0, 0).setTileScale(folded ? 0.55 * FOLDED_ZOOM : 0.55);
    if (folded) {
      this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.3);
    } else {
      backdrop.setTint(0x7a8490);
      this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.4);
      // Enemy glow from the top, ally glow from the bottom: the whole screen reads as one battlefield.
      const glow = this.add.graphics();
      glow.fillGradientStyle(TEAM.P2.main, TEAM.P2.main, TEAM.P2.main, TEAM.P2.main, 0.28, 0.28, 0, 0);
      glow.fillRect(0, 0, GAME_WIDTH, 380);
      glow.fillGradientStyle(TEAM.P1.main, TEAM.P1.main, TEAM.P1.main, TEAM.P1.main, 0, 0, 0.28, 0.28);
      glow.fillRect(0, 860, GAME_WIDTH, GAME_HEIGHT - 860);
    }
    this.field = folded ? this.add.container(0, LAYOUT.hingeY) : buildFieldHalf(this, 'top', 'P2');
    this.ground = this.add.container(0, 0);
    this.unitLayer = this.add.container(0, 0);
    this.fxLayer = this.add.container(0, 0);
    this.field.add([this.ground, this.unitLayer, this.fxLayer]);

    // Folded for real: nothing left to animate, the armies already sit where the fold put them.
    const flapUnits = this.add.container(0, 0);
    const hideEnemy = this.solo;
    const place = (id: TargetId, look: ConstructorParameters<typeof UnitView>[3], at: Point, mine: boolean): void => {
      const onFlap = mine && !folded;
      const pos = localPos(at, onFlap ? 'bottom' : 'top');
      const targetX = (look.side === 'P1' ? bunkers.P2 : bunkers.P1).pos.x;
      const view = new UnitView(this, pos.x, pos.y, look, facingFor(at.x, targetX, mine ? 'bottom' : 'top'));
      (onFlap ? flapUnits : this.unitLayer).add(view);
      this.views.set(id, view);
    };
    (['P1', 'P2'] as const).forEach((side) => {
      const b = bunkers[side];
      place(bunkerId(side), { side, kind: 'bunker' }, b.pos, side === this.me);
      if (b.shielded) this.views.get(bunkerId(side))?.setShield(true);
    });
    units.forEach((u) => {
      if (u.side !== this.me && u.hidden && hideEnemy) return;
      place(u.id, { side: u.side, kind: u.type, hidden: u.hidden, boosted: u.boosted }, u.pos, u.side === this.me);
    });

    sfx.voice('fire_in_the_hole');
    if (folded) {
      flapUnits.destroy();
      await this.showFolded();
    } else {
      await this.animateFold(flapUnits);
    }
    this.views.forEach((v) => v.showHpBar());
    // With no screen HP bars, the bunkers' own bars carry the score, so make them easy to read.
    if (folded) this.views.forEach((v) => v.look.kind === 'bunker' && v.setLargeHpBar());
    this.separateFaceOffs();
    await wait(this, 450);
  }

  /** Outer screen of a folded iPhone Duo: the merged battlefield, upright and centred, with a slam for the fold. */
  private async showFolded(): Promise<void> {
    this.unitLayer.sort('y');
    this.field.setScale(FOLDED_ZOOM).setPosition(GAME_WIDTH / 2 - (GAME_WIDTH / 2) * FOLDED_ZOOM, FOLDED_CENTER_Y - FIELD_CENTER_LOCAL_Y * FOLDED_ZOOM);
    this.field.setAlpha(0);
    await tweenAsync(this, { targets: this.field, alpha: 1, duration: 260 });
    sfx.slam();
    haptic([60, 40, 30]);
    this.cameras.main.shake(200, 0.005);
    shockwave(this, this.fxLayer, GAME_WIDTH / 2, -LAYOUT.hingeHalf - FIELD.height / 2, 720);
    await wait(this, 300);
  }

  /** Regular iPhones (FOLD button): the bottom half flips over the hinge onto the enemy half. */
  private async animateFold(flapUnits: Phaser.GameObjects.Container): Promise<void> {
    const flap = buildFieldHalf(this, 'bottom', this.me);
    flap.add(flapUnits);
    const hinge = buildHinge(this);
    const shade = this.add.rectangle(GAME_WIDTH / 2, LAYOUT.hingeY - LAYOUT.hingeHalf - FIELD.height / 2, GAME_WIDTH, FIELD.height, 0x000000, 0);
    this.children.bringToTop(flap);

    const title = label(this, GAME_WIDTH / 2, LAYOUT.hingeY, 'FOLD', { size: 72, color: hex(COLORS.gold) }).setDepth(50).setScale(0);
    await tweenAsync(this, { targets: title, scale: 1, duration: 260, ease: 'Back.Out' });
    await wait(this, 250);
    this.tweens.add({ targets: title, alpha: 0, scale: 1.6, duration: 250 });

    sfx.whoosh();
    let flipped = false;
    await new Promise<void>((resolve) => {
      this.tweens.addCounter({
        from: 0,
        to: 1,
        duration: 950,
        ease: 'Cubic.In',
        onUpdate: (tw) => {
          const t = tw.getValue() ?? 0;
          const scaleY = Math.cos(t * Math.PI);
          flap.setScale(1 + Math.sin(t * Math.PI) * 0.08, scaleY);
          shade.setFillStyle(0x000000, t * 0.45);
          if (!flipped && scaleY < 0) {
            flipped = true;
            flapUnits.list.forEach((o) => o instanceof UnitView && o.setVerticalFlip(true));
          }
        },
        onComplete: () => resolve(),
      });
    });

    sfx.slam();
    haptic([60, 40, 30]);
    this.cameras.main.shake(260, 0.007);
    this.cameras.main.flash(120, 200, 220, 255);
    shade.destroy();
    for (let i = 0; i <= 6; i++) dustPuff(this, this.fxLayer, LAYOUT.fieldX + (i * FIELD.width) / 6, -LAYOUT.hingeHalf - 10, 1.4);
    shockwave(this, this.fxLayer, GAME_WIDTH / 2, -LAYOUT.hingeHalf - FIELD.height / 2, 720);

    // Merge: P1's army now sits on top of P2's field exactly where the fold dropped it.
    flapUnits.list.slice().forEach((o) => {
      if (!(o instanceof UnitView)) return;
      o.setVerticalFlip(false);
      o.setScale(1);
      o.setY(-o.y);
      this.unitLayer.add(o);
    });
    flap.destroy();
    this.unitLayer.sort('y');

    await wait(this, 200);
    this.tweens.add({ targets: hinge, alpha: 0, duration: 300 });
    await tweenAsync(this, {
      targets: this.field,
      x: GAME_WIDTH / 2 - (GAME_WIDTH / 2) * ZOOM,
      y: BL.fieldCenter - FIELD_CENTER_LOCAL_Y * ZOOM,
      scale: ZOOM,
      duration: 650,
      ease: 'Cubic.InOut',
    });
  }

  /** Units whose bodies landed on each other step aside into a face-off so both stay readable. */
  private separateFaceOffs(): void {
    const entries = [...this.views.entries()];
    const nudged = new Set<UnitView>();
    entries.forEach(([idA, a]) => {
      entries.forEach(([idB, b]) => {
        if (a.look.side !== 'P1' || b.look.side !== 'P2' || nudged.has(a) || nudged.has(b)) return;
        const pa = this.unitPos.get(idA);
        const pb = this.unitPos.get(idB);
        if (!pa || !pb || distance(pa, pb) >= radiusOf(a.look.kind) + radiusOf(b.look.kind)) return;
        if (a.look.kind === 'bunker' || b.look.kind === 'bunker') return;
        nudged.add(a);
        nudged.add(b);
        a.faceToward(b.x, b.y);
        b.faceToward(a.x, a.y);
        this.tweens.add({ targets: a, x: a.x - 16, y: a.y + 8, duration: 260, ease: 'Back.Out' });
        this.tweens.add({ targets: b, x: b.x + 16, y: b.y - 8, duration: 260, ease: 'Back.Out' });
        sparks(this, this.fxLayer, (a.x + b.x) / 2, (a.y + b.y) / 2, COLORS.gold, 8);
      });
    });
  }

  // ---------- HUD ----------

  private buildHud(): void {
    const name = (side: Side): string =>
      this.solo ? (side === this.me ? 'YOU' : this.data_.opponent.name.toUpperCase()) : `PLAYER ${side === 'P1' ? 1 : 2}`;
    const make = (side: Side, y: number): NonNullable<BattleScene['hpBars']>[Side] => {
      const container = this.add.container(GAME_WIDTH / 2, y).setDepth(100);
      const bg = this.add.graphics();
      bg.fillStyle(COLORS.bgDeep, 0.92).fillRoundedRect(-340, -42, 680, 84, 22);
      bg.fillStyle(COLORS.outline, 1).fillRoundedRect(-200, -14, 520, 32, 14);
      bg.fillStyle(0x3a1010, 1).fillRoundedRect(-196, -10, 512, 24, 10);
      const fill = this.add.graphics();
      const avatar = !this.solo ? '' : side === this.me ? playerAvatarKey(this, loadProfile()) : avatarKey(this.data_.opponent.name);
      const icon = this.add.image(-300, 0, pickTexture(this, avatar, `bunker_${TEAM[side].art}_intact`, `bunker_${side}`));
      icon.setScale(Math.min(64 / icon.width, 64 / icon.height));
      const title = label(this, -250, -24, name(side), { size: 22, align: 'left', color: TEAM[side].css });
      const text = label(this, 60, 2, '', { size: 20 });
      container.add([bg, fill, icon, title, text]);
      container.setY(side === this.me ? y + 160 : y - 160);
      this.tweens.add({ targets: container, y, duration: 400, ease: 'Back.Out' });
      return { fill, text, container };
    };
    const enemy = otherSide(this.me);
    if (this.data_.physicalFold) return;
    const hpBars = { [enemy]: make(enemy, BL.enemyBar), [this.me]: make(this.me, BL.allyBar) } as Record<Side, ReturnType<typeof make>>;
    this.hpBars = hpBars;
    this.buildRoster(enemy, BL.enemyRoster);
    this.buildRoster(this.me, BL.allyRoster);
    if (this.data_.mode === 'local') {
      // Face to face: Player 2's bar and roster turn toward them across the table.
      hpBars.P2.container.setAngle(180);
      this.roster.forEach((item) => item.side === 'P2' && item.container.setAngle(180));
    }
    (['P1', 'P2'] as const).forEach((s) => this.setBunkerBar(s, this.maxHp.get(bunkerId(s)) ?? 1));

    const phases: [string, string][] = [['reveal', 'REVEAL'], ['clash', 'CRASH'], ['volley', 'VOLLEY']];
    phases.forEach(([phase, title], i) => {
      const x = GAME_WIDTH / 2 + (i - 1) * 190;
      const chip = this.add.container(x, BL.chips).setDepth(100);
      const g = this.add.graphics().setName('bg');
      chip.add([g, label(this, 0, 0, title, { size: 18 })]);
      this.phaseChips.set(phase, chip);
      this.drawChip(phase, 'pending');
    });
    const logPanel = this.add.graphics().setDepth(99);
    logPanel.fillStyle(0x000000, 0.7).fillRoundedRect(20, BL.log - 28, GAME_WIDTH - 40, 56, 14);
    logPanel.lineStyle(2, COLORS.cyan, 0.35).strokeRoundedRect(20, BL.log - 28, GAME_WIDTH - 40, 56, 14);
    this.logText = label(this, GAME_WIDTH / 2, BL.log, 'Battle begins!', { size: 20, wrap: 640 }).setDepth(100);

    const speed = new GameButton(this, GAME_WIDTH / 2, BL.speed, 'SPEED  x1', {
      width: 300,
      skin: 'gold',
      fontSize: 22,
      onClick: () => {
        this.speedUp = !this.speedUp;
        this.tweens.timeScale = this.speedUp ? 2.2 : 1;
        this.time.timeScale = this.speedUp ? 2.2 : 1;
        speed.text.setText(this.speedUp ? 'SPEED  x2' : 'SPEED  x1');
      },
    });
    speed.setDepth(100);
  }

  /** Row of unit icons per army: HP bars drain as they take hits, a red cross marks the fallen. */
  private buildRoster(side: Side, y: number): void {
    const hideEnemy = this.solo && side !== this.me;
    const order: Record<string, number> = { tank: 0, mortar: 1, rocket: 2, bomb: 3 };
    const units = this.data_.setup.units.filter((u) => u.side === side).sort((a, b) => (order[a.type] ?? 9) - (order[b.type] ?? 9));
    const gap = 62;
    const x0 = GAME_WIDTH / 2 - ((units.length - 1) * gap) / 2;
    units.forEach((u, i) => {
      const c = this.add.container(x0 + i * gap, y).setDepth(100);
      const ring = this.add.graphics();
      ring.fillStyle(0x000000, 0.75).fillCircle(0, 0, 25);
      ring.lineStyle(2, TEAM[side].main, 0.9).strokeCircle(0, 0, 25);
      const hidden = hideEnemy && u.hidden;
      const icon = this.add.image(0, -2, hidden ? 'fx_question' : unitArt(this, u.type, side));
      icon.setScale(Math.min(40 / icon.width, 40 / icon.height));
      const bar = this.add.graphics();
      c.add([ring, icon, bar]);
      c.setScale(0);
      this.tweens.add({ targets: c, scale: 1, delay: i * 40, duration: 260, ease: 'Back.Out' });
      const item = { container: c, icon, bar, side };
      this.roster.set(u.id, item);
      this.drawRosterBar(item, u.type === 'bomb' ? -1 : 1);
    });
  }

  private drawRosterBar(item: RosterItem, frac: number): void {
    item.bar.clear();
    if (frac < 0) return;
    item.bar.fillStyle(0x000000, 0.9).fillRect(-22, 22, 44, 6);
    item.bar.fillStyle(frac > 0.5 ? COLORS.green : frac > 0.25 ? COLORS.gold : COLORS.danger, 1).fillRect(-21, 23, 42 * frac, 4);
  }

  private updateRoster(id: TargetId, frac: number, gone: boolean): void {
    const item = this.roster.get(id);
    if (!item) return;
    this.drawRosterBar(item, frac);
    this.tweens.add({ targets: item.container, scale: 1.25, duration: 80, yoyo: true });
    if (!gone) return;
    item.icon.setTint(0x444444);
    item.container.setAlpha(0.55);
    const cross = label(this, 0, -2, 'X', { size: 34, color: '#ff3b3b' });
    item.container.add(cross);
  }

  private revealRoster(unit: PlacedUnit): void {
    const item = this.roster.get(unit.id);
    if (!item) return;
    item.icon.setTexture(unitArt(this, unit.type, unit.side));
    item.icon.setScale(Math.min(40 / item.icon.width, 40 / item.icon.height));
  }

  private drawChip(phase: string, state: 'pending' | 'active' | 'done'): void {
    const chip = this.phaseChips.get(phase);
    const g = chip?.getByName('bg');
    if (!chip || !(g instanceof Phaser.GameObjects.Graphics)) return;
    g.clear();
    g.fillStyle(COLORS.outline, 1).fillRoundedRect(-68, -22, 136, 44, 22);
    g.fillStyle(state === 'active' ? COLORS.orange : state === 'done' ? 0x3d5a27 : 0x1b2614, 1).fillRoundedRect(-64, -18, 128, 36, 18);
    chip.setAlpha(state === 'pending' ? 0.55 : 1);
    if (state === 'active') this.tweens.add({ targets: chip, scale: { from: 1.25, to: 1 }, duration: 300, ease: 'Back.Out' });
  }

  private markPhase(phase: string): void {
    let reached = false;
    [...this.phaseChips.keys()].reverse().forEach((p) => {
      if (p === phase) {
        reached = true;
        this.drawChip(p, 'active');
        return;
      }
      if (reached) this.drawChip(p, 'done');
    });
  }

  private log(text: string, color = '#ffffff'): void {
    if (!this.logText) return;
    this.logText.setText(text).setColor(color);
    this.tweens.add({ targets: this.logText, scale: { from: 1.12, to: 1 }, duration: 160 });
  }

  private nameOf(id: TargetId): string {
    const unit = this.data_.setup.units.find((u) => u.id === id);
    const side: Side = unit ? unit.side : id === 'bunker-P1' ? 'P1' : 'P2';
    const owner = this.solo ? (side === this.me ? 'Your' : 'Enemy') : side === 'P1' ? 'Blue' : 'Red';
    return `${owner} ${unit ? UNITS[unit.type].name : 'Bunker'}`;
  }

  private sideColor(id: TargetId): string {
    const unit = this.data_.setup.units.find((u) => u.id === id);
    const side: Side = unit ? unit.side : id === 'bunker-P1' ? 'P1' : 'P2';
    return side === 'P1' ? '#9cc4ff' : '#ffaaaa';
  }

  private setBunkerBar(side: Side, hp: number): void {
    const max = this.maxHp.get(bunkerId(side)) ?? 1;
    const frac = Math.max(0, hp / max);
    const bar = this.hpBars?.[side];
    if (!bar) return;
    bar.fill.clear();
    bar.fill.fillStyle(frac > 0.5 ? 0x5cd65c : frac > 0.25 ? 0xffc93c : 0xff4d4d, 1);
    if (frac > 0) bar.fill.fillRoundedRect(-196, -10, Math.max(16, 512 * frac), 24, 10);
    bar.fill.fillStyle(0xffffff, 0.25).fillRoundedRect(-192, -8, Math.max(8, 504 * frac), 8, 4);
    bar.text.setText(`${Math.round(hp)} / ${max}`);
    this.tweens.add({ targets: bar.container, scale: 1.04, duration: 70, yoyo: true });
  }

  // ---------- Playback ----------

  private async playEvents(events: BattleEvent[]): Promise<void> {
    let volleyShots: Promise<void>[] = [];
    const flushVolley = async (): Promise<void> => {
      await Promise.all(volleyShots);
      volleyShots = [];
    };

    for (const event of events) {
      if (event.kind === 'attack') {
        volleyShots.push(this.animateAttack(event).catch((err: unknown) => console.error('attack animation failed', err)));
        await wait(this, 170);
        continue;
      }
      await flushVolley();
      // A broken animation must never freeze the match: log it and keep the battle moving.
      await this.animateEvent(event).catch((err: unknown) => console.error(`${event.kind} animation failed`, err));
    }
    await flushVolley();
  }

  private async animateEvent(event: Exclude<BattleEvent, { kind: 'attack' }>): Promise<void> {
    switch (event.kind) {
      case 'phase': {
        this.markPhase(event.phase);
        await wait(this, 250);
        if (event.phase === 'volley') {
          await banner(this, `VOLLEY ${event.round ?? 1}`, COLORS.gold, GAME_HEIGHT / 2, event.round === 1 ? 'Survivors fire at anything in range' : undefined);
          return;
        }
        const b = PHASE_BANNER[event.phase];
        if (b) await banner(this, b.text, b.color, GAME_HEIGHT / 2, b.sub);
        return;
      }
      case 'reveal':
        return this.animateReveal(event.unitId);
      case 'defuse':
        return this.animateDefuse(event.tankId, event.bombId);
      case 'mineBlast':
        return this.animateMine(event);
      case 'clash':
        return this.animateClash(event);
      case 'shieldBreak': {
        const v = this.views.get(bunkerId(event.side));
        if (!v) return;
        v.setShield(false);
        sfx.shieldBreak();
        sparkBurst(this, this.fxLayer, v.x, v.y - 20, 0x8ff0ff, 220);
        sparks(this, this.fxLayer, v.x, v.y, 0x8ff0ff, 24);
        callout(this, this.fxLayer, v.x, v.y, 'SHIELD DOWN!', 0x8ff0ff, 30);
        await wait(this, 350);
        return;
      }
      case 'bunkerDestroyed':
        return this.animateBunkerDestroyed(event.side);
    }
  }

  private async animateReveal(unitId: string): Promise<void> {
    const unit = this.data_.setup.units.find((u) => u.id === unitId);
    if (!unit) return;
    let view = this.views.get(unitId);
    if (!view) {
      const pos = localPos(unit.pos, 'top');
      view = new UnitView(this, pos.x, pos.y, { side: unit.side, kind: unit.type, boosted: unit.boosted }, unit.side === this.me ? 'ne' : 'sw');
      view.showHpBar();
      this.unitLayer.add(view);
      this.views.set(unitId, view);
      const sharing = [...this.views.entries()].find(([id, v]) => {
        const p = this.unitPos.get(id);
        return id !== unitId && v.active && p !== undefined && v.look.side !== unit.side && distance(p, unit.pos) < radiusOf(v.look.kind) + radiusOf(unit.type);
      });
      if (sharing) {
        view.setPosition(view.x + 16, view.y - 8);
        sharing[1].setPosition(sharing[1].x - 16, sharing[1].y + 8);
      }
      this.unitLayer.sort('y');
    } else {
      view.look.hidden = false;
      view.refreshBadges();
    }
    this.revealRoster(unit);
    view.setAlpha(0);
    this.tweens.add({ targets: view, alpha: 1, duration: 300 });
    purplePoof(this, this.fxLayer, view.x, view.y);
    sfx.reveal();
    await wait(this, 380);
  }

  private async animateDefuse(tankId: string, bombId: string): Promise<void> {
    this.log(`${this.nameOf(tankId)} outranked ${this.nameOf(bombId)} and cleared it`, this.sideColor(tankId));
    const tank = this.views.get(tankId);
    const bomb = this.views.get(bombId);
    if (tank && bomb) {
      await tweenAsync(this, { targets: tank, x: bomb.x, y: bomb.y, duration: 260, ease: 'Quad.In' });
      sfx.defuse();
      sparks(this, this.fxLayer, bomb.x, bomb.y, 0x9be7ff, 16);
      callout(this, this.fxLayer, bomb.x, bomb.y, 'MINE CLEARED', 0x9be7ff, 24);
      this.views.delete(bombId);
      this.updateRoster(bombId, -1, true);
      void bomb.die();
      await wait(this, 450);
    }
  }

  private async animateMine(event: Extract<BattleEvent, { kind: 'mineBlast' }>): Promise<void> {
    const { bombId, ambush, hits, chain } = event;
    const bomb = this.views.get(bombId);
    if (!bomb) return;
    bomb.showFiring(560);
    if (!chain) {
      sparkBurst(this, this.fxLayer, bomb.x, bomb.y - 10, TEAM[bomb.look.side].light, 130);
      for (let i = 0; i < 3; i++) {
        sfx.beep();
        bomb.flashHit();
        await wait(this, 140 - i * 30);
      }
    }
    explosion(this, this.fxLayer, this.ground, bomb.x, bomb.y, 'big');
    this.blastRing(bomb.x, bomb.y, TEAM[bomb.look.side].light);
    const kills = hits.filter((h) => h.killed).length;
    // The first hit of a triggered mine is the enemy that landed on it; everything after is splash.
    const splash = chain ? hits : hits.slice(1);
    const friendly = splash.some((h) => this.views.get(String(h.targetId))?.look.side === bomb.look.side);
    const what = chain ? 'went off in the blast' : `exploded${ambush ? ' from hiding' : ''}`;
    this.log(`${this.nameOf(bombId)} ${what}! ${kills} destroyed${friendly ? ' (friendly fire)' : ''}`, this.sideColor(bombId));
    if (ambush) callout(this, this.fxLayer, bomb.x, bomb.y - 20, 'AMBUSH!', COLORS.purple, 44);
    if (friendly) callout(this, this.fxLayer, bomb.x, bomb.y + 34, 'FRIENDLY FIRE!', 0xff9a3d, 30);
    this.views.delete(bombId);
    this.updateRoster(bombId, -1, true);
    void bomb.die();
    hits.forEach((h) => this.applyHit(h));
    await wait(this, 750);
  }

  /** Expanding ring showing how far a mine's blast reaches, so players learn to keep mines off their bunker. */
  private blastRing(x: number, y: number, color: number): void {
    const ring = this.add.graphics();
    ring.lineStyle(4, color, 0.9).strokeCircle(0, 0, MINE_BLAST.radius + 18);
    ring.fillStyle(color, 0.12).fillCircle(0, 0, MINE_BLAST.radius + 18);
    ring.setPosition(x, y).setScale(0.2);
    this.fxLayer.add(ring);
    this.tweens.add({ targets: ring, scale: 1, duration: 220, ease: 'Cubic.Out' });
    this.tweens.add({ targets: ring, alpha: 0, delay: 260, duration: 420, onComplete: () => ring.destroy() });
  }

  private async animateClash(event: Extract<BattleEvent, { kind: 'clash' }>): Promise<void> {
    const { p1Id, p2Id, hits, levels, result } = event;
    const a = this.views.get(p1Id);
    const b = this.views.get(p2Id);
    if (!a || !b) return;
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    if (levels) {
      // Show both levels first so players read the rule: higher level wins the crash.
      [a, b].forEach((v, i) => {
        const tag = label(this, v.x, v.y - 48, `LV ${levels[i]}`, { size: 16, color: TEAM[v.look.side].css });
        this.fxLayer.add(tag);
        this.tweens.add({ targets: tag, alpha: 0, y: tag.y - 16, delay: 700, duration: 300, onComplete: () => tag.destroy() });
      });
      await wait(this, 350);
    }
    await Promise.all([
      tweenAsync(this, { targets: a, x: (a.x + mx) / 2 + (mx - a.x) * 0.4, y: (a.y + my) / 2, duration: 160, yoyo: true, ease: 'Quad.In' }),
      tweenAsync(this, { targets: b, x: (b.x + mx) / 2 + (mx - b.x) * 0.4, y: (b.y + my) / 2, duration: 160, yoyo: true, ease: 'Quad.In' }),
      wait(this, 150).then(() => {
        sfx.clang();
        haptic(25);
        sparks(this, this.fxLayer, mx, my, COLORS.gold, 20);
        this.cameras.main.shake(100, 0.003);
      }),
    ]);
    const bunkerHit = p1Id.startsWith('bunker') || p2Id.startsWith('bunker');
    if (bunkerHit) {
      callout(this, this.fxLayer, mx, my, 'DIRECT HIT', COLORS.orange, 28);
      this.log(`${this.nameOf(p1Id)} crashed into ${this.nameOf(p2Id)}`, '#ffd23f');
    } else if (result === 'both') {
      callout(this, this.fxLayer, mx, my, 'BOTH DESTROYED', COLORS.orange, 26);
      this.log(`${this.nameOf(p1Id)} and ${this.nameOf(p2Id)} destroyed each other (same level)`, '#ffd23f');
    } else if (levels && result) {
      const winnerId = result === 'p1' ? p1Id : p2Id;
      const loserId = result === 'p1' ? p2Id : p1Id;
      callout(this, this.fxLayer, mx, my, `LV ${Math.max(...levels)} WINS`, COLORS.gold, 26);
      this.log(`${this.nameOf(winnerId)} crushed ${this.nameOf(loserId)} (higher level)`, this.sideColor(winnerId));
    }
    hits.forEach((h) => this.applyHit(h));
    await wait(this, 650);
  }

  private async animateAttack(event: Extract<BattleEvent, { kind: 'attack' }>): Promise<void> {
    const attacker = this.views.get(event.attackerId);
    const hit = event.hits[0];
    if (!attacker || !hit) return;
    const target = this.views.get(hit.targetId);
    if (!target) {
      this.applyHit(hit);
      return;
    }
    const tx = target.x + Phaser.Math.Between(-8, 8);
    const ty = target.y + Phaser.Math.Between(-8, 8);
    await attacker.aimAt(tx, ty);
    attacker.showFiring(event.style === 'turret' ? 320 : 260);

    switch (event.style) {
      case 'shell':
        await this.fireShell(attacker, tx, ty);
        break;
      case 'rocket':
        await this.fireRocket(attacker, tx, ty);
        break;
      case 'turret':
        await this.fireTurret(attacker, tx, ty);
        break;
      default:
        await this.fireCannon(attacker, tx, ty);
    }
    explosion(this, this.fxLayer, this.ground, tx, ty, event.style === 'rocket' ? 'medium' : 'small');
    this.log(`${this.nameOf(event.attackerId)} hit ${this.nameOf(hit.targetId)} -${hit.damage}`, this.sideColor(event.attackerId));
    this.applyHit(hit);
  }

  private async fireCannon(from: UnitView, tx: number, ty: number): Promise<void> {
    sfx.cannon();
    from.recoil(tx, ty);
    const angle = Phaser.Math.Angle.Between(from.x, from.y, tx, ty);
    const mx = from.x + Math.cos(angle) * 40;
    const my = from.y + Math.sin(angle) * 40;
    muzzleFlash(this, this.fxLayer, mx, my);
    const tracer = this.add.image(mx, my, pickTexture(this, 'fx_laser_bolt', 'fx_tracer')).setRotation(angle + Math.PI / 2).setBlendMode(Phaser.BlendModes.ADD);
    tracer.setScale(44 / tracer.height).setTint(TEAM[from.look.side].light);
    this.fxLayer.add(tracer);
    await tweenAsync(this, { targets: tracer, x: tx, y: ty, duration: 150 });
    tracer.destroy();
  }

  private async fireShell(from: UnitView, tx: number, ty: number): Promise<void> {
    sfx.mortarThump();
    sfx.whistle(0.5);
    muzzleFlash(this, this.fxLayer, from.x + 24, from.y - 30);
    const shell = this.add.image(from.x + 24, from.y - 30, 'fx_shell');
    const shellBase = 30 / Math.max(shell.width, shell.height);
    shell.setScale(shellBase);
    const shadow = this.add.image(from.x, from.y + 20, 'fx_shadow').setDisplaySize(26, 12);
    this.fxLayer.add([shadow, shell]);
    const sx = shell.x;
    const sy = shell.y;
    const arc = 140 + Phaser.Math.Distance.Between(sx, sy, tx, ty) * 0.35;
    await new Promise<void>((resolve) => {
      this.tweens.addCounter({
        from: 0,
        to: 1,
        duration: 520,
        onUpdate: (tw) => {
          const t = tw.getValue() ?? 0;
          shell.setPosition(sx + (tx - sx) * t, sy + (ty - sy) * t - Math.sin(t * Math.PI) * arc);
          shell.setScale(shellBase * (1 + Math.sin(t * Math.PI) * 0.8));
          shell.setRotation(Math.atan2(ty - sy, tx - sx) + (t - 0.5) * 1.2);
          shadow.setPosition(sx + (tx - sx) * t, sy + (ty - sy) * t + 20);
        },
        onComplete: () => resolve(),
      });
    });
    shell.destroy();
    shadow.destroy();
  }

  private async fireRocket(from: UnitView, tx: number, ty: number): Promise<void> {
    sfx.rocket();
    const rocket = this.add.image(from.x, from.y, pickTexture(this, 'fx_missile', 'fx_rocket'));
    rocket.setScale(46 / rocket.height);
    this.fxLayer.add(rocket);
    const trail = this.add.particles(0, 0, 'fx_smoke', {
      follow: rocket,
      frequency: 18,
      lifespan: 500,
      scale: { start: 0.35, end: 0.9 },
      alpha: { start: 0.6, end: 0 },
      speed: 10,
    });
    this.fxLayer.addAt(trail, 0);
    const sx = from.x;
    const sy = from.y;
    const bend = Phaser.Math.Between(-60, 60);
    let prev = { x: sx, y: sy };
    await new Promise<void>((resolve) => {
      this.tweens.addCounter({
        from: 0,
        to: 1,
        duration: 480,
        ease: 'Quad.In',
        onUpdate: (tw) => {
          const t = tw.getValue() ?? 0;
          const x = sx + (tx - sx) * t + Math.sin(t * Math.PI) * bend;
          const y = sy + (ty - sy) * t - Math.sin(t * Math.PI) * 50;
          rocket.setPosition(x, y);
          rocket.setRotation(Phaser.Math.Angle.Between(prev.x, prev.y, x, y) + Math.PI / 2);
          prev = { x, y };
        },
        onComplete: () => resolve(),
      });
    });
    rocket.destroy();
    trail.stop();
    this.time.delayedCall(600, () => trail.destroy());
  }

  private async fireTurret(from: UnitView, tx: number, ty: number): Promise<void> {
    sfx.turret();
    for (let i = 0; i < 3; i++) {
      const tracer = this.add.image(from.x, from.y - 10, pickTexture(this, 'fx_laser_bolt', 'fx_tracer')).setBlendMode(Phaser.BlendModes.ADD);
      tracer.setScale(30 / tracer.height).setTint(TEAM[from.look.side].light);
      tracer.setRotation(Phaser.Math.Angle.Between(from.x, from.y, tx, ty) + Math.PI / 2);
      this.fxLayer.add(tracer);
      this.tweens.add({ targets: tracer, x: tx + Phaser.Math.Between(-10, 10), y: ty + Phaser.Math.Between(-10, 10), duration: 120, onComplete: () => tracer.destroy() });
      await wait(this, 70);
    }
    await wait(this, 60);
  }

  private applyHit(hit: Hit): void {
    const view = this.views.get(hit.targetId);
    const isBunker = hit.targetId.startsWith('bunker');
    if (view) {
      damageNumber(this, this.fxLayer, view.x, view.y, hit.damage, hit.killed);
      if (view.hasShield) shieldHit(this, this.fxLayer, view.x, view.y - 20, TEAM[view.look.side].light);
      view.flashHit();
      const max = this.maxHp.get(hit.targetId) ?? 1;
      view.setHpFraction(hit.remainingHp / max);
    }
    if (!isBunker) this.updateRoster(hit.targetId, hit.remainingHp / (this.maxHp.get(hit.targetId) || 1), hit.killed);
    if (isBunker) {
      const side = hit.targetId === 'bunker-P1' ? 'P1' : 'P2';
      this.setBunkerBar(side, hit.remainingHp);
      return;
    }
    if (hit.killed && view) {
      this.views.delete(hit.targetId);
      explosion(this, this.fxLayer, this.ground, view.x, view.y, 'medium');
      void view.die();
    }
  }

  private async animateBunkerDestroyed(side: Side): Promise<void> {
    const view = this.views.get(bunkerId(side));
    if (!view) return;
    this.tweens.timeScale = 0.6;
    this.time.timeScale = 0.6;
    for (let i = 0; i < 5; i++) {
      explosion(this, this.fxLayer, this.ground, view.x + Phaser.Math.Between(-40, 40), view.y + Phaser.Math.Between(-35, 25), i === 4 ? 'big' : 'medium');
      await wait(this, 160);
    }
    shockwave(this, this.fxLayer, view.x, view.y, 460);
    void view.die();
    this.tweens.timeScale = this.speedUp ? 2.2 : 1;
    this.time.timeScale = this.speedUp ? 2.2 : 1;
    sfx.voice('target_destroyed');
    await banner(this, 'BUNKER DESTROYED!', TEAM[side === 'P1' ? 'P2' : 'P1'].main, GAME_HEIGHT / 2);
  }

  // ---------- Result ----------

  private showResult(outcome: BattleOutcome): void {
    this.tweens.timeScale = 1;
    this.time.timeScale = 1;
    const isBot = this.solo;
    const winner = outcome.winner;
    const humanWon = winner === this.me;
    const title =
      winner === 'draw' ? 'DRAW' : isBot ? (humanWon ? 'VICTORY!' : 'DEFEAT') : `PLAYER ${winner === 'P1' ? 1 : 2} WINS!`;
    const titleColor = winner === 'draw' ? 0xdddddd : isBot ? (humanWon ? COLORS.gold : 0xff6b6b) : TEAM[winner].main;
    const celebrate = winner !== 'draw' && (!isBot || humanWon);
    sfx.music(undefined);
    this.time.delayedCall(900, () => sfx.voice(winner === 'draw' ? 'its_a_tie' : celebrate ? 'mission_completed' : 'mission_failed'));

    const dim = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0).setDepth(200).setInteractive();
    this.tweens.add({ targets: dim, fillAlpha: 0.65, duration: 300 });
    const root = this.add.container(GAME_WIDTH / 2, 600).setDepth(201);

    if (celebrate) {
      const glowBg = this.add.image(0, -300, 'fx_soft').setTint(COLORS.gold).setBlendMode(Phaser.BlendModes.ADD).setScale(9).setAlpha(0.35);
      root.add(glowBg);
      this.tweens.add({ targets: glowBg, alpha: 0.55, scale: 10, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      const sparkle = this.add.particles(0, -300, 'fx_spark', {
        x: { min: -300, max: 300 },
        y: { min: -120, max: 120 },
        lifespan: 1400,
        frequency: 180,
        scale: { start: 0.6, end: 0 },
        alpha: { start: 1, end: 0 },
        speedY: { min: -40, max: -10 },
        tint: COLORS.gold,
        blendMode: 'ADD',
      });
      root.add(sparkle);
      sfx.victory();
    } else {
      sfx.defeat();
    }
    root.add(panel(this, 0, 60, 620, 660));
    const bannerKey = celebrate ? 'ui_banner_victory' : 'ui_banner_defeat';
    if (this.textures.exists(bannerKey)) {
      const plate = this.add.image(0, -300, bannerKey);
      plate.setScale(560 / plate.width);
      root.add(plate);
    }
    const titleText = label(this, 0, -300, title, { size: 64, color: hex(titleColor) });
    root.add(titleText);
    titleText.setScale(3).setAlpha(0);
    this.tweens.add({ targets: titleText, scale: 1, alpha: 1, duration: 380, ease: 'Back.Out' });

    const showStars = (side: Side, y: number, size: number, delay: number): void => {
      const stars = outcome[side].stars;
      for (let i = 0; i < 3; i++) {
        const x = (i - 1) * size * 1.05;
        const lift = i === 1 ? -size * 0.18 : 0;
        root.add(this.add.image(x, y + lift, 'icon_star_empty').setDisplaySize(size, size));
        if (i >= stars) continue;
        const star = this.add.image(x, y + lift, 'icon_star').setDisplaySize(size, size);
        const s = star.scale;
        star.setScale(s * 3).setAlpha(0).setAngle(-90);
        root.add(star);
        this.tweens.add({
          targets: star,
          scale: s,
          alpha: 1,
          angle: 0,
          delay: delay + i * 380,
          duration: 300,
          ease: 'Back.Out',
          onStart: () => {
            sfx.star(i);
            haptic(20);
          },
          onComplete: () => sparks(this, root, x, y + lift, COLORS.gold, 16),
        });
      }
    };

    if (isBot) {
      showStars(this.me, -150, 120, 400);
      root.add(label(this, 0, -50, `Enemy bunker damage: ${Math.round(outcome[this.me].damageDealtPct * 100)}%`, { size: 28 }));
      root.add(label(this, 0, -10, `Your bunker took: ${Math.round(outcome[otherSide(this.me)].damageDealtPct * 100)}%`, { size: 22, color: '#ffb3b3' }));
      this.applyRewards(outcome, root);
    } else {
      root.add(label(this, -150, -190, 'PLAYER 1', { size: 26, color: TEAM.P1.css }));
      root.add(label(this, 150, -190, 'PLAYER 2', { size: 26, color: TEAM.P2.css }));
      const container = root;
      const sub = (side: Side, x: number): void => {
        const c = this.add.container(x, 0);
        container.add(c);
        const stars = outcome[side].stars;
        for (let i = 0; i < 3; i++) {
          const img = this.add.image((i - 1) * 64, -120, i < stars ? 'icon_star' : 'icon_star_empty').setDisplaySize(60, 60);
          c.add(img);
          if (i < stars) {
            const full = img.scaleX;
            img.setScale(0);
            this.tweens.add({ targets: img, scale: full, delay: 400 + i * 300, duration: 280, ease: 'Back.Out', onStart: () => sfx.star(i) });
          }
        }
        c.add(label(this, 0, -50, `${Math.round(outcome[side].damageDealtPct * 100)}% damage`, { size: 24 }));
      };
      sub('P1', -150);
      sub('P2', 150);
    }

    const again = new GameButton(this, -150, 310, 'REMATCH', { width: 280, skin: 'green', fontSize: 26, onClick: () => this.rematch() });
    const menu = new GameButton(this, 150, 310, 'MENU', { width: 280, skin: 'blue', fontSize: 26, onClick: () => this.scene.start('Menu') });
    root.add([again, menu]);
    if (this.data_.physicalFold) root.add(label(this, 0, 400, 'Open your iPhone Duo to plan the next battle', { size: 17, color: '#cfe3ff' }));
    root.setY(600 + 900);
    this.tweens.add({ targets: root, y: 600, duration: 500, ease: 'Back.Out' });
  }

  private applyRewards(outcome: BattleOutcome, root: Phaser.GameObjects.Container): void {
    const profile = loadProfile();
    const won = outcome.winner === this.me;
    const draw = outcome.winner === 'draw';
    const stars = outcome[this.me].stars;
    const online = this.data_.online;
    if (online?.canEnd) {
      // It's our Game Center turn: record the official result for both players.
      void FoldNative.endMatch({ matchId: online.matchId, data: online.data, result: draw ? 'tied' : won ? 'won' : 'lost' }).catch(() => undefined);
    }
    // Online battles can be watched again by both players; rewards are granted once per match.
    const firstTime = !online || markRewarded(online.matchId);
    const opponentTrophies = online ? profile.trophies : this.data_.opponent.trophies;
    const delta = !firstTime || draw ? 0 : trophyDelta(profile.trophies, opponentTrophies, won);
    const coins = !firstTime ? 0 : draw ? 50 : coinReward(won, stars);
    if (firstTime) {
      recordBattle(profile, { won, draw, stars, trophyDelta: delta, coins });
      saveProfile(profile);
      void reportProgress(profile, won, stars);
      if (online && won) void unlockAchievement(GC_IDS.achievements.onlineWin);
    }

    const trophyIcon = this.add.image(-150, 110, 'icon_trophy').setDisplaySize(64, 64);
    const trophyText = label(this, -80, 110, '+0', { size: 40, align: 'left', color: delta >= 0 ? hex(COLORS.gold) : '#ff8080' });
    const coinIcon = this.add.image(90, 110, 'icon_coin').setDisplaySize(60, 60);
    const coinText = label(this, 140, 110, '+0', { size: 40, align: 'left', color: hex(COLORS.gold) });
    root.add([trophyIcon, trophyText, coinIcon, coinText]);
    root.add(label(this, 0, 180, `Total: ${profile.trophies} trophies · ${profile.coins} coins`, { size: 22, color: '#cfe3c0' }));

    this.tweens.addCounter({
      from: 0,
      to: delta,
      delay: 1500,
      duration: 700,
      onUpdate: (tw) => trophyText.setText(`${delta >= 0 ? '+' : ''}${Math.round(tw.getValue() ?? 0)}`),
    });
    this.time.delayedCall(1700, () => this.coinShower(root, coinIcon.x, coinIcon.y, Math.min(12, Math.round(coins / 12))));
    let lastCoin = 0;
    this.tweens.addCounter({
      from: 0,
      to: coins,
      delay: 1700,
      duration: 900,
      onUpdate: (tw) => {
        const v = Math.round(tw.getValue() ?? 0);
        coinText.setText(`+${v}`);
        if (v - lastCoin >= 10) {
          lastCoin = v;
          sfx.coin();
        }
      },
    });
  }

  /** Spinning coins (generated sheet) burst out of the panel and fly into the coin counter. */
  private coinShower(root: Phaser.GameObjects.Container, tx: number, ty: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const coin = playSheet(this, root, 'fx_coin_spin_sheet', Phaser.Math.Between(-160, 160), Phaser.Math.Between(-40, 60), {
        size: 46,
        frameRate: 24 + Phaser.Math.Between(0, 8),
        loop: true,
      });
      if (!coin) return;
      coin.setScale(0);
      this.tweens.add({ targets: coin, scale: 46 / coin.width, duration: 160, delay: i * 70, ease: 'Back.Out' });
      this.tweens.add({
        targets: coin,
        x: tx,
        y: ty,
        delay: 300 + i * 70,
        duration: 520,
        ease: 'Cubic.In',
        onComplete: () => {
          sfx.coin();
          coin.destroy();
        },
      });
    }
  }

  private rematch(): void {
    if (this.data_.online) {
      this.scene.start('Online');
      return;
    }
    if (!canStartMatch(loadProfile(), this.data_.mode)) {
      showPaywall(this, () => this.rematch(), this.data_.mode);
      return;
    }
    if (this.data_.mode === 'bot') {
      const profile = loadProfile();
      this.scene.start('Game', { mode: 'bot', opponent: rollOpponent(profile.trophies), difficulty: this.data_.difficulty });
      return;
    }
    this.scene.start('Game', { mode: 'local', opponent: this.data_.opponent, difficulty: this.data_.difficulty });
  }
}

/** Pushes trophies to the Game Center leaderboard and unlocks any newly earned achievements. */
const reportProgress = async (profile: Profile, won: boolean, stars: number): Promise<void> => {
  await submitTrophies(profile.trophies);
  const a = GC_IDS.achievements;
  if (won) await unlockAchievement(a.firstWin);
  if (won && stars === 3) await unlockAchievement(a.threeStars);
  if (profile.trophies >= 800) await unlockAchievement(a.goldLeague);
  if (profile.trophies >= 2600) await unlockAchievement(a.legendLeague);
  if (Object.values(profile.levels).some((l) => l >= 5)) await unlockAchievement(a.maxUpgrade);
};
