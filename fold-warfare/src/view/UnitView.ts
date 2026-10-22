import Phaser from 'phaser';
import { BUNKER, UNITS } from '../core/balance';
import type { Side, UnitType } from '../core/types';
import { COLORS, FONT, TEAM } from '../theme';
import { pickTexture } from '../art/assets';
import { playSheet } from './fx';
import { tweenAsync } from '../ui/widgets';

export type UnitLook = {
  side: Side;
  kind: UnitType | 'bunker';
  hidden?: boolean;
  boosted?: boolean;
};

/** Diagonal facings of the 3/4 art. NE + SW are drawn; NW + SE are those two mirrored. */
export type Facing = 'ne' | 'nw' | 'sw' | 'se';

const ART: Record<UnitType | 'bunker', string> = {
  tank: 'tank',
  mortar: 'trooper',
  bomb: 'mine',
  rocket: 'rocket',
  bunker: 'bunker',
};
const ANGLED = new Set<UnitType | 'bunker'>(['tank', 'mortar', 'rocket']);
const FIRE_STATE: Partial<Record<UnitType | 'bunker', string>> = { tank: 'fire', mortar: 'fire', rocket: 'fired', bunker: 'firing', bomb: 'armed' };
const DEATH_STATE: Partial<Record<UnitType | 'bunker', string>> = { tank: 'wreck', mortar: 'dead', rocket: 'wreck', bunker: 'destroyed' };
/** Max on-screen box for each unit's art, in pixels at field scale 1. */
const BOX: Record<UnitType | 'bunker', [number, number]> = {
  tank: [78, 66],
  mortar: [46, 62],
  bomb: [42, 42],
  rocket: [78, 70],
  bunker: [120, 108],
};
const LEGACY: Record<UnitType | 'bunker', string> = {
  tank: 'tank_body',
  mortar: 'mortar',
  bomb: 'bomb',
  rocket: 'rocket_body',
  bunker: 'bunker',
};

export const radiusOf = (kind: UnitType | 'bunker'): number => (kind === 'bunker' ? BUNKER.bodyRadius : UNITS[kind].bodyRadius);
export const rangeOf = (kind: UnitType | 'bunker'): number => (kind === 'bunker' ? BUNKER.turretRange : UNITS[kind].range);

/**
 * Every army faces the enemy: on screen, your units (bottom half) always point up and the opponent's
 * (top half) always point down at you. Only left/right changes toward a target, so nothing aims backward.
 */
export const facingToward = (dx: number, up: boolean): Facing => (up ? (dx >= 0 ? 'ne' : 'nw') : dx >= 0 ? 'se' : 'sw');

export const facingFor = (x: number, targetX: number, half: 'top' | 'bottom'): Facing => facingToward(targetX - x, half === 'bottom');

/**
 * One unit or bunker on the board, drawn from the generated 3/4-view art. It swaps images for states
 * (idle -> firing -> wreck) and mirrors horizontally for the two undrawn diagonals.
 */
export class UnitView extends Phaser.GameObjects.Container {
  readonly look: UnitLook;
  private readonly sprite: Phaser.GameObjects.Image;
  private readonly shadow: Phaser.GameObjects.Ellipse;
  private readonly rings: Phaser.GameObjects.Graphics;
  private readonly badges: Phaser.GameObjects.Container;
  private hpBar: Phaser.GameObjects.Graphics | undefined;
  private hpLag = 1;
  private hpNow = 1;
  private largeHpBar = false;
  private shield: Phaser.GameObjects.Image | undefined;
  private readonly idleTweens: Phaser.Tweens.Tween[] = [];
  private facing: Facing;
  private artState: string;
  private dead = false;
  private nameTag: Phaser.GameObjects.Text | undefined;

  constructor(scene: Phaser.Scene, x: number, y: number, look: UnitLook, facing: Facing) {
    super(scene, x, y);
    this.look = look;
    this.facing = facing;
    this.artState = look.kind === 'bunker' ? 'intact' : 'idle';
    const r = radiusOf(look.kind);

    this.rings = scene.add.graphics();
    this.shadow = scene.add.ellipse(0, r * 0.25, r * 2.3, r * 0.95, 0x000000, 0.45);
    this.sprite = scene.add.image(0, 0, '__MISSING').setOrigin(0.5, 0.62);
    this.badges = scene.add.container(r * 0.9, -r * 1.4);
    this.add([this.rings, this.shadow, this.sprite, this.badges]);
    this.applyTexture();
    this.refreshBadges();

    if (look.kind === 'bomb') {
      this.idleTweens.push(scene.tweens.add({ targets: this.sprite, y: -5, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' }));
      this.idleTweens.push(scene.tweens.add({ targets: this.shadow, scaleX: 0.85, scaleY: 0.85, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' }));
    }
    scene.add.existing(this);
  }

  private textureFor(state: string): { key: string; flip: boolean } {
    const { kind, side } = this.look;
    const base = `${ART[kind]}_${TEAM[side].art}`;
    const legacy = `${LEGACY[kind]}_${side}`;
    if (!ANGLED.has(kind)) {
      const fallbackState = kind === 'bunker' ? 'intact' : 'idle';
      return { key: pickTexture(this.scene, `${base}_${state}`, `${base}_${fallbackState}`, legacy), flip: false };
    }
    const angle = this.facing === 'ne' || this.facing === 'nw' ? 'ne' : 'sw';
    const other = angle === 'ne' ? 'sw' : 'ne';
    const flip = this.facing === 'nw' || this.facing === 'se';
    const key = pickTexture(
      this.scene,
      `${base}_${state}_${angle}`,
      `${base}_${state}`,
      `${base}_${state}_${other}`,
      `${base}_idle_${angle}`,
      `${base}_idle_ne`,
      legacy,
    );
    // Missing angle: borrow the other diagonal, mirrored, so at least left/right facing stays correct.
    const borrowed = key.endsWith(`_${other}`) || (angle === 'sw' && key.endsWith('_ne'));
    return { key, flip: borrowed ? !flip : flip };
  }

  private applyTexture(): void {
    const { key, flip } = this.textureFor(this.artState);
    const [bw, bh] = BOX[this.look.kind];
    this.sprite.setTexture(key);
    const frame = this.sprite.frame;
    const scale = Math.min(bw / frame.width, bh / frame.height);
    this.sprite.setScale(scale).setFlipX(flip);
  }

  /** Turns to the diagonal closest to (x, y), both in this view's parent space. */
  faceToward(x: number, y: number): void {
    if (!ANGLED.has(this.look.kind)) return;
    void y;
    const next = facingToward(x - this.x, this.facing === 'ne' || this.facing === 'nw');
    if (next === this.facing) return;
    this.facing = next;
    this.applyTexture();
  }

  setFacing(facing: Facing): void {
    this.facing = facing;
    this.applyTexture();
  }

  /** Briefly swaps to the firing art (muzzle flash baked in by the artist). */
  showFiring(ms = 220): void {
    const fire = FIRE_STATE[this.look.kind];
    if (!fire || this.dead) return;
    const restore = this.artState;
    this.artState = fire;
    this.applyTexture();
    this.scene.time.delayedCall(ms, () => {
      if (this.dead || !this.active) return;
      this.artState = restore;
      this.applyTexture();
    });
  }

  setBunkerState(state: 'intact' | 'damaged' | 'destroyed'): void {
    if (this.look.kind !== 'bunker' || this.artState === state) return;
    this.artState = state;
    this.applyTexture();
    if (state !== 'intact') this.igniteFire();
  }

  private fire: Phaser.GameObjects.Sprite[] = [];

  /** Looping flames on a wreck or a damaged bunker (generated fire-loop sheet). */
  private igniteFire(): void {
    if (this.fire.length > 0) return;
    const r = radiusOf(this.look.kind);
    const spots = this.look.kind === 'bunker' ? [[-r * 0.5, -r * 0.7], [r * 0.45, -r * 0.4]] : [[0, -r * 0.5]];
    spots.forEach(([dx, dy], i) => {
      const flame = playSheet(this.scene, this, 'fx_fire_loop_sheet', dx ?? 0, dy ?? 0, { size: r * 1.6, frameRate: 20 + i * 3, loop: true, add: true });
      if (flame) this.fire.push(flame);
    });
  }

  get hasShield(): boolean {
    return this.shield !== undefined;
  }

  refreshBadges(): void {
    this.badges.removeAll(true);
    const icons: string[] = [];
    if (this.look.hidden) icons.push(pickTexture(this.scene, 'icon_skill_hide', 'icon_hide'));
    if (this.look.boosted) icons.push(pickTexture(this.scene, 'icon_skill_boost', 'icon_boost'));
    icons.forEach((key, i) => this.badges.add(this.scene.add.image(0, i * 20, key).setDisplaySize(20, 20)));
    this.sprite.setAlpha(this.look.hidden ? 0.6 : 1);
  }

  /** Clips the range rings to one sector, so they never hint at reach across the fold. */
  setRangeMask(mask: Phaser.Display.Masks.GeometryMask): this {
    this.rings.setMask(mask);
    return this;
  }

  /** Dashed attack-range circle + solid body ring in team colour, like the concept art. */
  showRange(visible: boolean, strength = 1): this {
    const g = this.rings;
    g.clear();
    if (!visible) return this;
    const color = TEAM[this.look.side].main;
    const range = rangeOf(this.look.kind);
    const r = radiusOf(this.look.kind);
    if (range <= 0) {
      g.lineStyle(1.5, color, 0.8 * strength).strokeEllipse(0, r * 0.25, r * 2.2, r * 0.9);
      return this;
    }
    g.fillStyle(color, 0.04 * strength).fillCircle(0, 0, range);
    const dashes = Math.max(24, Math.round(range / 7));
    g.lineStyle(1.5, color, 0.4 * strength);
    for (let i = 0; i < dashes; i++) {
      const a0 = (i / dashes) * Math.PI * 2;
      g.beginPath();
      g.arc(0, 0, range, a0, a0 + (Math.PI * 2) / dashes / 2);
      g.strokePath();
    }
    g.lineStyle(1.5, color, 0.8 * strength).strokeEllipse(0, r * 0.25, r * 2.2, r * 0.9);
    return this;
  }

  setNameTag(text: string): void {
    this.nameTag?.destroy();
    this.nameTag = this.scene.add
      .text(0, -radiusOf(this.look.kind) * 2.2, text, { fontFamily: FONT, fontSize: '12px', color: '#cfe3ff', stroke: '#000000', strokeThickness: 3 })
      .setOrigin(0.5);
    this.add(this.nameTag);
  }

  /** Keeps sprites upright while the fold mirrors their parent container. */
  setVerticalFlip(flipped: boolean): void {
    this.setScale(this.scaleX, Math.abs(this.scaleY) * (flipped ? -1 : 1));
  }

  showHpBar(): void {
    if (this.hpBar) return;
    this.hpBar = this.scene.add.graphics();
    this.add(this.hpBar);
    this.drawHp();
  }

  setLargeHpBar(): void {
    this.largeHpBar = true;
    this.drawHp();
  }

  setHpFraction(fraction: number): void {
    this.hpNow = Phaser.Math.Clamp(fraction, 0, 1);
    this.showHpBar();
    this.drawHp();
    if (this.look.kind === 'bunker') this.setBunkerState(this.hpNow === 0 ? 'destroyed' : this.hpNow < 0.5 ? 'damaged' : 'intact');
    this.scene.tweens.addCounter({
      from: this.hpLag,
      to: this.hpNow,
      delay: 250,
      duration: 400,
      onUpdate: (tw) => {
        this.hpLag = tw.getValue() ?? this.hpNow;
        this.drawHp();
      },
    });
  }

  private drawHp(): void {
    const g = this.hpBar;
    if (!g) return;
    const r = radiusOf(this.look.kind);
    const w = this.largeHpBar ? 130 : this.look.kind === 'bunker' ? 86 : Math.max(40, r * 2);
    const h = this.largeHpBar ? 12 : this.look.kind === 'bunker' ? 7 : 5;
    const y = r * 0.95;
    g.clear();
    g.fillStyle(0x000000, 0.85).fillRoundedRect(-w / 2 - 2, y - 2, w + 4, h + 4, 4);
    g.fillStyle(0x3a1010, 1).fillRect(-w / 2, y, w, h);
    g.fillStyle(0xffffff, 0.85).fillRect(-w / 2, y, Math.max(0, w * this.hpLag), h);
    g.fillStyle(this.hpNow > 0.5 ? COLORS.green : this.hpNow > 0.25 ? COLORS.gold : COLORS.danger, 1);
    if (this.hpNow > 0) g.fillRect(-w / 2, y, Math.max(3, w * this.hpNow), h);
  }

  setShield(on: boolean): void {
    if (on && !this.shield) {
      const size = radiusOf(this.look.kind) * 3.6;
      this.shield = this.scene.add.image(0, -radiusOf(this.look.kind) * 0.35, pickTexture(this.scene, 'fx_shield_dome', 'fx_shield'));
      this.shield.setTint(TEAM[this.look.side].light).setBlendMode(Phaser.BlendModes.ADD);
      const target = size / this.shield.width;
      this.shield.setScale(0);
      this.add(this.shield);
      this.scene.tweens.add({ targets: this.shield, scale: target, duration: 450, ease: 'Back.Out' });
      this.scene.tweens.add({ targets: this.shield, alpha: 0.65, duration: 900, yoyo: true, repeat: -1, delay: 450 });
    }
    if (!on && this.shield) {
      const s = this.shield;
      this.shield = undefined;
      this.scene.tweens.killTweensOf(s);
      this.scene.tweens.add({ targets: s, scale: s.scale * 1.4, alpha: 0, duration: 300, onComplete: () => s.destroy() });
    }
  }

  async aimAt(x: number, y: number): Promise<void> {
    this.faceToward(x, y);
    await tweenAsync(this.scene, { targets: this.sprite, scaleX: this.sprite.scaleX * 1.04, duration: 60, yoyo: true });
  }

  recoil(towardX: number, towardY: number): void {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, towardX, towardY);
    this.scene.tweens.add({ targets: this.sprite, x: -Math.cos(angle) * 7, y: -Math.sin(angle) * 7, duration: 60, yoyo: true, ease: 'Quad.Out' });
  }

  flashHit(): void {
    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(60, () => this.active && this.sprite.clearTint());
    this.scene.tweens.add({ targets: this.sprite, x: Phaser.Math.Between(-5, 5), duration: 40, yoyo: true, repeat: 2 });
  }

  async die(): Promise<void> {
    this.dead = true;
    this.idleTweens.forEach((t) => t.stop());
    this.hpBar?.setVisible(false);
    this.badges.setVisible(false);
    this.rings.clear();
    this.setShield(false);
    const death = DEATH_STATE[this.look.kind];
    if (death && this.textureFor(death).key.includes(`_${death}`)) {
      this.artState = death;
      this.applyTexture();
      this.sprite.setAlpha(1);
      if (this.look.kind !== 'mortar') this.igniteFire();
      await tweenAsync(this.scene, { targets: this.sprite, scaleY: this.sprite.scaleY * 0.92, duration: 200, yoyo: true });
      return;
    }
    this.sprite.setTint(0x333333);
    await tweenAsync(this.scene, { targets: this, alpha: 0, scale: this.scale * 0.7, duration: 420, ease: 'Cubic.In' });
    this.destroy();
  }

  get isDead(): boolean {
    return this.dead;
  }
}
