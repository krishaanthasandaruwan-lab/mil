import Phaser from 'phaser';
import { haptic, sfx } from '../audio/sfx';
import { pickTexture } from '../art/assets';
import { COLORS, FONT, hex } from '../theme';

export type TextOptions = {
  size?: number;
  color?: string;
  stroke?: number;
  align?: 'left' | 'center' | 'right';
  wrap?: number;
};

/** HUD text: blocky military font, thin dark outline, soft glow underneath. */
export const label = (scene: Phaser.Scene, x: number, y: number, text: string, opts: TextOptions = {}): Phaser.GameObjects.Text => {
  const size = opts.size ?? 32;
  const t = scene.add.text(x, y, text, {
    fontFamily: FONT,
    fontSize: `${size}px`,
    color: opts.color ?? '#ffffff',
    stroke: '#000000',
    strokeThickness: opts.stroke ?? Math.max(2, Math.round(size / 12)),
    align: opts.align ?? 'center',
    wordWrap: opts.wrap ? { width: opts.wrap } : undefined,
  });
  t.setOrigin(opts.align === 'left' ? 0 : opts.align === 'right' ? 1 : 0.5, 0.5);
  t.setShadow(0, Math.max(1, size / 18), 'rgba(0,0,0,0.55)', Math.max(1, size / 16), true, true);
  return t;
};

export type ButtonSkin = 'fold' | 'green' | 'blue' | 'red' | 'gold';

const SKIN_COLOR: Record<ButtonSkin, number> = {
  fold: COLORS.orange,
  green: COLORS.green,
  blue: COLORS.blueUi,
  red: COLORS.danger,
  gold: COLORS.gold,
};

export type ButtonOptions = {
  width: number;
  skin?: ButtonSkin;
  fontSize?: number;
  icon?: string;
  onClick: () => void;
};

/**
 * Glowing capsule button built on the generated `ui_btn_*` plates; text is drawn by the game so it can
 * be any language. Falls back to a drawn capsule when the art is missing.
 */
export class GameButton extends Phaser.GameObjects.Container {
  private readonly plate: Phaser.GameObjects.Image | Phaser.GameObjects.Graphics;
  private readonly skin: ButtonSkin;
  private enabled = true;
  readonly text: Phaser.GameObjects.Text;
  readonly buttonHeight: number;

  constructor(scene: Phaser.Scene, x: number, y: number, text: string, opts: ButtonOptions) {
    super(scene, x, y);
    this.skin = opts.skin ?? 'green';
    // Only the primary call-to-action keeps the glowing art plate; everything else is a flat, quiet button.
    const key = `ui_btn_${this.skin}`;
    if (this.skin === 'fold' && scene.textures.exists(key)) {
      const img = scene.add.image(0, 0, key);
      img.setScale(opts.width / img.width);
      this.plate = img;
      this.buttonHeight = img.displayHeight;
    } else {
      this.buttonHeight = Math.min(72, Math.max(46, opts.width * 0.22));
      const w = opts.width;
      const h = this.buttonHeight;
      const color = SKIN_COLOR[this.skin];
      const g = scene.add.graphics();
      g.fillStyle(0x0b1119, 0.94).fillRoundedRect(-w / 2, -h / 2, w, h, 10);
      g.fillGradientStyle(color, color, color, color, 0.38, 0.38, 0.12, 0.12);
      g.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
      g.lineStyle(2, color, 0.95).strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
      g.fillStyle(color, 1).fillRect(-w / 2 + 14, h / 2 - 4, w - 28, 2);
      this.plate = g;
    }
    const size = Math.min(opts.fontSize ?? 99, Math.round(this.buttonHeight * (this.plate instanceof Phaser.GameObjects.Image ? 0.36 : 0.42)));
    this.text = label(scene, 0, 0, text, { size });
    this.add(this.plate);
    if (opts.icon) {
      const icon = scene.add.image(-opts.width * 0.3, 0, opts.icon).setDisplaySize(size * 1.4, size * 1.4);
      this.add(icon);
      this.text.setX(size * 0.6);
    }
    this.add(this.text);

    this.setSize(opts.width * 0.92, this.buttonHeight * 0.8);
    this.setInteractive({ useHandCursor: true });
    this.on('pointerdown', () => {
      if (!this.enabled) return;
      sfx.unlock();
      this.setPressed(true);
      scene.tweens.add({ targets: this, scale: 0.95, duration: 70 });
    });
    const release = (fire: boolean): void => {
      if (!this.enabled) return;
      this.setPressed(false);
      scene.tweens.add({ targets: this, scale: 1, duration: 140, ease: 'Back.Out' });
      if (!fire) return;
      sfx.click();
      haptic(10);
      opts.onClick();
    };
    this.on('pointerup', () => release(true));
    this.on('pointerout', () => release(false));
    scene.add.existing(this);
  }

  private setPressed(pressed: boolean): void {
    if (!(this.plate instanceof Phaser.GameObjects.Image)) {
      this.plate.setAlpha(pressed ? 0.75 : 1);
      return;
    }
    if (this.skin === 'fold' && this.scene.textures.exists('ui_btn_fold_pressed')) {
      this.plate.setTexture(pressed ? 'ui_btn_fold_pressed' : 'ui_btn_fold');
      return;
    }
    if (pressed) this.plate.setTint(0xbbbbbb);
    else this.plate.clearTint();
  }

  setEnabled(enabled: boolean): this {
    this.enabled = enabled;
    this.setAlpha(enabled ? 1 : 0.45);
    return this;
  }
}

/** Sci-fi dialog panel (nine-sliced `ui_panel`, or a drawn fallback). */
export const panel = (scene: Phaser.Scene, x: number, y: number, w: number, h: number): Phaser.GameObjects.GameObject => {
  if (scene.textures.exists('ui_panel')) {
    const sx = Math.round(Math.min(70, w * 0.16));
    const sy = Math.round(Math.min(80, h * 0.16));
    return scene.add.nineslice(x, y, 'ui_panel', undefined, w, h, sx, sx, sy, sy);
  }
  const g = scene.add.graphics({ x, y });
  g.fillStyle(0x000000, 0.5).fillRoundedRect(-w / 2, -h / 2 + 10, w, h, 18);
  g.fillStyle(COLORS.panel, 0.96).fillRoundedRect(-w / 2, -h / 2, w, h, 18);
  g.lineStyle(3, COLORS.cyan, 0.7).strokeRoundedRect(-w / 2, -h / 2, w, h, 18);
  return g;
};

/** Pill counter (trophies, coins) for HUDs. */
export const statChip = (scene: Phaser.Scene, x: number, y: number, icon: string, value: string): Phaser.GameObjects.Container => {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.7).fillRoundedRect(-70, -20, 150, 40, 20);
  g.lineStyle(2, COLORS.cyan, 0.45).strokeRoundedRect(-70, -20, 150, 40, 20);
  const img = scene.add.image(-66, 0, pickTexture(scene, icon)).setDisplaySize(50, 50);
  const t = label(scene, 16, 0, value, { size: 22 }).setName('value');
  c.add([g, img, t]);
  return c;
};

export const floatText = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  color: number,
  size = 30,
  parent?: Phaser.GameObjects.Container,
): void => {
  const t = label(scene, x, y, text, { size, color: hex(color) });
  parent?.add(t);
  t.setScale(0.3);
  scene.tweens.add({ targets: t, scale: 1, duration: 220, ease: 'Back.Out' });
  scene.tweens.add({ targets: t, y: y - 60, alpha: 0, delay: 500, duration: 600, ease: 'Cubic.In', onComplete: () => t.destroy() });
};

export const wait = (scene: Phaser.Scene, ms: number): Promise<void> =>
  new Promise((resolve) => scene.time.delayedCall(ms, () => resolve()));

export const tweenAsync = (scene: Phaser.Scene, config: Phaser.Types.Tweens.TweenBuilderConfig): Promise<void> =>
  new Promise((resolve) => scene.tweens.add({ ...config, onComplete: () => resolve() }));

/** iOS-style on/off switch. */
export const toggleSwitch = (scene: Phaser.Scene, x: number, y: number, value: boolean, onChange: (on: boolean) => void): Phaser.GameObjects.Container => {
  const c = scene.add.container(x, y);
  const track = scene.add.graphics();
  const knob = scene.add.circle(0, 0, 15, 0xffffff);
  let on = value;
  const draw = (): void => {
    track.clear();
    track.fillStyle(on ? COLORS.green : 0x2a3340, 1).fillRoundedRect(-32, -18, 64, 36, 18);
    track.lineStyle(2, on ? COLORS.green : COLORS.steel, 1).strokeRoundedRect(-32, -18, 64, 36, 18);
  };
  draw();
  knob.setX(on ? 14 : -14);
  c.add([track, knob]);
  c.setSize(80, 44).setInteractive({ useHandCursor: true });
  c.on('pointerup', () => {
    on = !on;
    draw();
    scene.tweens.add({ targets: knob, x: on ? 14 : -14, duration: 140, ease: 'Cubic.Out' });
    sfx.click();
    haptic(8);
    onChange(on);
  });
  return c;
};
