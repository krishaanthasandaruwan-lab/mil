import Phaser from 'phaser';
import { haptic, sfx } from '../audio/sfx';
import { COLORS, GAME_WIDTH, hex } from '../theme';
import { pickTexture } from '../art/assets';
import { label } from '../ui/widgets';

type Layer = Phaser.GameObjects.Container;

const burst = (
  scene: Phaser.Scene,
  layer: Layer,
  x: number,
  y: number,
  texture: string,
  count: number,
  config: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig,
): void => {
  const emitter = scene.add.particles(x, y, texture, { emitting: false, ...config });
  layer.add(emitter);
  emitter.explode(count);
  const life = typeof config.lifespan === 'number' ? config.lifespan : 1200;
  scene.time.delayedCall(life + 200, () => emitter.destroy());
};

export type BlastSize = 'small' | 'medium' | 'big';

const SIZE_SCALE: Record<BlastSize, number> = { small: 0.55, medium: 1, big: 1.8 };

export const explosion = (scene: Phaser.Scene, layer: Layer, ground: Layer, x: number, y: number, size: BlastSize = 'medium'): void => {
  const s = SIZE_SCALE[size];
  sfx.explosion(size);
  haptic(size === 'big' ? [40, 30, 60] : size === 'medium' ? 30 : 12);
  scene.cameras.main.shake(size === 'big' ? 300 : 150, size === 'big' ? 0.006 : size === 'medium' ? 0.003 : 0.0015);

  const crater = scene.add.image(x, y + 6, 'fx_crater');
  crater.setScale((70 * s) / crater.width).setAlpha(0.85);
  ground.add(crater);
  scene.tweens.add({ targets: crater, alpha: 0.35, delay: 2500, duration: 1500 });

  const flash = scene.add.image(x, y, 'fx_soft').setScale(0.5 * s).setBlendMode(Phaser.BlendModes.ADD);
  layer.add(flash);
  scene.tweens.add({ targets: flash, scale: 4 * s, alpha: 0, duration: 260, ease: 'Cubic.Out', onComplete: () => flash.destroy() });

  const ring = scene.add.image(x, y, 'fx_ring').setScale(0.1).setAlpha(0.9);
  layer.add(ring);
  scene.tweens.add({ targets: ring, scale: 1.4 * s, alpha: 0, duration: 380, ease: 'Cubic.Out', onComplete: () => ring.destroy() });

  if (scene.textures.exists('fx_explosion_sheet') && scene.textures.get('fx_explosion_sheet').frameTotal > 16) {
    if (!scene.anims.exists('explode')) {
      scene.anims.create({ key: 'explode', frames: scene.anims.generateFrameNumbers('fx_explosion_sheet', { start: 0, end: 15 }), frameRate: 30 });
    }
    const boom = scene.add.sprite(x, y - 10 * s, 'fx_explosion_sheet', 0).setBlendMode(Phaser.BlendModes.ADD);
    boom.setScale((150 * s) / boom.width).setAngle(Phaser.Math.Between(0, 360));
    layer.add(boom);
    boom.play('explode');
    boom.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => boom.destroy());
  }
  if (size === 'big') playSheet(scene, ground, 'fx_shockwave_sheet', x, y, { size: 300, frameRate: 26, add: true, alpha: 0.9 });
  playSheet(scene, layer, 'fx_smoke_sheet', x, y - 30 * s, { size: 170 * s, frameRate: 14, alpha: 0.8 });
  burst(scene, layer, x, y, 'fx_fire', Math.round(7 * s), {
    speed: { min: 60 * s, max: 260 * s },
    scale: { start: 0.9 * s, end: 0 },
    lifespan: 520,
    blendMode: 'ADD',
    rotate: { min: 0, max: 360 },
  });
  burst(scene, layer, x, y, 'fx_smoke', Math.round(5 * s), {
    speed: { min: 20, max: 110 * s },
    scale: { start: 0.6 * s, end: 1.6 * s },
    alpha: { start: 0.75, end: 0 },
    lifespan: 1100,
    gravityY: -60,
  });
  burst(scene, layer, x, y, 'fx_debris', Math.round(6 * s), {
    speed: { min: 150, max: 380 * s },
    angle: { min: 200, max: 340 },
    gravityY: 900,
    rotate: { start: 0, end: 720 },
    lifespan: 800,
    scale: { min: 0.8, max: 1.6 },
  });
};

export const dustPuff = (scene: Phaser.Scene, layer: Layer, x: number, y: number, scale = 1): void => {
  burst(scene, layer, x, y + 20 * scale, 'fx_smoke', 8, {
    speed: { min: 40, max: 120 },
    angle: { min: 160, max: 380 },
    scale: { start: 0.35 * scale, end: 0.9 * scale },
    alpha: { start: 0.55, end: 0 },
    lifespan: 600,
    tint: 0xd8c49a,
  });
};

export const sparks = (scene: Phaser.Scene, layer: Layer, x: number, y: number, tint: number = COLORS.gold, count = 8): void => {
  count = Math.ceil(count * 0.6);
  burst(scene, layer, x, y, 'fx_spark', count, {
    speed: { min: 120, max: 340 },
    scale: { start: 0.8, end: 0 },
    lifespan: 380,
    blendMode: 'ADD',
    tint,
  });
};

export const purplePoof = (scene: Phaser.Scene, layer: Layer, x: number, y: number): void => {
  burst(scene, layer, x, y, 'fx_smoke', 12, {
    speed: { min: 30, max: 140 },
    scale: { start: 0.5, end: 1.3 },
    alpha: { start: 0.8, end: 0 },
    lifespan: 700,
    tint: COLORS.purple,
  });
  sparks(scene, layer, x, y, COLORS.purple, 10);
};

export const muzzleFlash = (scene: Phaser.Scene, layer: Layer, x: number, y: number): void => {
  const key = pickTexture(scene, 'fx_muzzle_flash', 'fx_fire');
  const f = scene.add.image(x, y, key).setBlendMode(Phaser.BlendModes.ADD).setAngle(Phaser.Math.Between(0, 360));
  const base = 46 / f.width;
  f.setScale(base * 0.6);
  layer.add(f);
  scene.tweens.add({ targets: f, scale: base * 1.2, alpha: 0, duration: 130, onComplete: () => f.destroy() });
};

export const damageNumber = (scene: Phaser.Scene, layer: Layer, x: number, y: number, damage: number, emphasis: boolean): void => {
  const size = emphasis ? 30 : 24;
  const t = label(scene, x + Phaser.Math.Between(-12, 12), y - 30, `-${damage}`, {
    size,
    color: emphasis ? hex(COLORS.gold) : '#ffffff',
  });
  layer.add(t);
  t.setScale(0.2);
  scene.tweens.add({ targets: t, scale: 1, duration: 200, ease: 'Back.Out' });
  scene.tweens.add({ targets: t, y: t.y - 55, alpha: 0, delay: 450, duration: 550, ease: 'Cubic.In', onComplete: () => t.destroy() });
};

export const callout = (scene: Phaser.Scene, layer: Layer, x: number, y: number, text: string, color: number, size = 34): void => {
  const t = label(scene, x, y - 70, text, { size, color: hex(color) });
  layer.add(t);
  t.setScale(0).setAngle(-8);
  scene.tweens.add({ targets: t, scale: 1, angle: 0, duration: 260, ease: 'Back.Out' });
  scene.tweens.add({ targets: t, y: t.y - 30, alpha: 0, delay: 800, duration: 400, onComplete: () => t.destroy() });
};

/** Full-width slam-in banner for phase changes ("CLASH!", "VOLLEY 2"). `flip` turns it toward a player sitting at the top edge (face-to-face mode). */
export const banner = (scene: Phaser.Scene, text: string, color: number, y = 640, sub?: string, flip = false): Promise<void> =>
  new Promise((resolve) => {
    sfx.banner();
    const c = scene.add.container(GAME_WIDTH / 2, y).setDepth(1000).setAngle(flip ? 180 : 0);
    const strip = scene.add.graphics();
    strip.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.2, 0.2, 0.8, 0.8);
    strip.fillRect(-GAME_WIDTH / 2, -56, GAME_WIDTH, 56);
    strip.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.8, 0.8, 0.2, 0.2);
    strip.fillRect(-GAME_WIDTH / 2, 0, GAME_WIDTH, 56);
    strip.fillStyle(color, 0.9);
    strip.fillRect(-GAME_WIDTH / 2, -58, GAME_WIDTH, 3);
    strip.fillRect(-GAME_WIDTH / 2, 55, GAME_WIDTH, 3);
    const t = label(scene, 0, sub ? -10 : 0, text, { size: 40, color: hex(color) });
    c.add([strip, t]);
    if (sub) c.add(label(scene, 0, 30, sub, { size: 18, color: '#cfe3ff' }));
    c.setScale(1, 0);
    t.setScale(1.4).setAlpha(0);
    scene.tweens.add({ targets: c, scaleY: 1, duration: 160, ease: 'Back.Out' });
    scene.tweens.add({ targets: t, scale: 1, alpha: 1, duration: 260, ease: 'Back.Out' });
    scene.tweens.add({
      targets: c,
      scaleY: 0,
      alpha: 0,
      delay: 700,
      duration: 200,
      ease: 'Cubic.In',
      onComplete: () => {
        c.destroy();
        resolve();
      },
    });
  });

export type SheetOptions = {
  size: number;
  frameRate?: number;
  loop?: boolean;
  tint?: number;
  add?: boolean;
  alpha?: number;
};

/**
 * Plays one of the generated 4x4 effect sheets once (or looped). Returns undefined when the sheet
 * isn't available so callers can fall back to code-drawn effects.
 */
export const playSheet = (
  scene: Phaser.Scene,
  layer: Layer,
  key: string,
  x: number,
  y: number,
  opts: SheetOptions,
): Phaser.GameObjects.Sprite | undefined => {
  if (!scene.textures.exists(key)) return undefined;
  const frames = scene.textures.get(key).frameTotal - 1;
  if (frames < 4) return undefined;
  const animKey = `${key}:${opts.loop ? 'loop' : 'once'}:${opts.frameRate ?? 24}`;
  if (!scene.anims.exists(animKey)) {
    scene.anims.create({
      key: animKey,
      frames: scene.anims.generateFrameNumbers(key, { start: 0, end: frames - 1 }),
      frameRate: opts.frameRate ?? 24,
      repeat: opts.loop ? -1 : 0,
    });
  }
  const sprite = scene.add.sprite(x, y, key, 0);
  sprite.setScale(opts.size / sprite.width).setAlpha(opts.alpha ?? 1);
  if (opts.add) sprite.setBlendMode(Phaser.BlendModes.ADD);
  if (opts.tint !== undefined) sprite.setTint(opts.tint);
  layer.add(sprite);
  sprite.play(animKey);
  if (!opts.loop) sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => sprite.destroy());
  return sprite;
};

export const smokePuff = (scene: Phaser.Scene, layer: Layer, x: number, y: number, size = 110): void => {
  playSheet(scene, layer, 'fx_smoke_sheet', x, y - size * 0.25, { size, frameRate: 16, alpha: 0.85 });
};

export const shieldHit = (scene: Phaser.Scene, layer: Layer, x: number, y: number, tint: number, size = 170): void => {
  playSheet(scene, layer, 'fx_shield_hit_sheet', x, y, { size, frameRate: 30, add: true, tint });
};

export const sparkBurst = (scene: Phaser.Scene, layer: Layer, x: number, y: number, tint: number = COLORS.cyan, size = 150): void => {
  playSheet(scene, layer, 'fx_spark_sheet', x, y, { size, frameRate: 28, add: true, tint });
};

export const shockwave = (scene: Phaser.Scene, layer: Layer, x: number, y: number, size = 320): void => {
  playSheet(scene, layer, 'fx_shockwave_sheet', x, y, { size, frameRate: 24, add: true });
};
