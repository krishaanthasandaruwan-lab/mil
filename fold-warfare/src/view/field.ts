import Phaser from 'phaser';
import { FIELD } from '../core/balance';
import type { Point, Side } from '../core/types';
import { pickTexture } from '../art/assets';
import { COLORS, FONT, GAME_WIDTH, LAYOUT, TEAM, hex } from '../theme';

export type Half = 'top' | 'bottom';

/** Position inside a field-half container (anchored on the hinge line; negative y = above it). */
export const localPos = (p: Point, half: Half): Point => ({
  x: LAYOUT.fieldX + p.x,
  y: (half === 'bottom' ? 1 : -1) * (LAYOUT.hingeHalf + p.y),
});

/**
 * One half of the board: dark rocky ground, a team-coloured glow and HUD corner brackets — and deliberately
 * NO grid, so players must judge where the fold will land by eye. Anchored on the hinge so the fold can
 * mirror it with a single scaleY tween.
 */
export const buildFieldHalf = (scene: Phaser.Scene, half: Half, side: Side): Phaser.GameObjects.Container => {
  const c = scene.add.container(0, LAYOUT.hingeY);
  const sign = half === 'bottom' ? 1 : -1;
  const near = sign * LAYOUT.hingeHalf;
  const top = half === 'bottom' ? near : near - FIELD.height;
  const team = TEAM[side];

  const groundKey = pickTexture(scene, 'env_ground_tile', `field_${half}`);
  const ground = scene.add.tileSprite(0, top, GAME_WIDTH, FIELD.height, groundKey).setOrigin(0, 0);
  if (groundKey === 'env_ground_tile') ground.setTileScale(0.55).setTilePosition(half === 'bottom' ? 0 : 400, half === 'bottom' ? 0 : 260);
  c.add(ground);

  const g = scene.add.graphics();
  // Team glow strongest at the far edge, fading toward the hinge.
  const farAlpha = 0.22;
  if (half === 'top') g.fillGradientStyle(team.main, team.main, team.main, team.main, farAlpha, farAlpha, 0.02, 0.02);
  else g.fillGradientStyle(team.main, team.main, team.main, team.main, 0.02, 0.02, farAlpha, farAlpha);
  g.fillRect(0, top, GAME_WIDTH, FIELD.height);
  g.fillStyle(0x000000, 0.35).fillRect(0, top, GAME_WIDTH, FIELD.height);
  // Out-of-bounds side strips.
  g.fillStyle(0x000000, 0.55);
  g.fillRect(0, top, LAYOUT.fieldX, FIELD.height);
  g.fillRect(LAYOUT.fieldX + FIELD.width, top, GAME_WIDTH - LAYOUT.fieldX - FIELD.width, FIELD.height);
  // Field edge + corner brackets.
  g.lineStyle(2, team.main, 0.45).strokeRect(LAYOUT.fieldX, top, FIELD.width, FIELD.height);
  const L = 26;
  g.lineStyle(4, team.light, 0.9);
  [
    [LAYOUT.fieldX, top, 1, 1],
    [LAYOUT.fieldX + FIELD.width, top, -1, 1],
    [LAYOUT.fieldX, top + FIELD.height, 1, -1],
    [LAYOUT.fieldX + FIELD.width, top + FIELD.height, -1, -1],
  ].forEach(([x, y, dx, dy]) => {
    if (x === undefined || y === undefined || dx === undefined || dy === undefined) return;
    g.beginPath();
    g.moveTo(x + dx * L, y);
    g.lineTo(x, y);
    g.lineTo(x, y + dy * L);
    g.strokePath();
  });
  c.add(g);
  return c;
};

/** World-space mask covering exactly one sector (full width, field height). */
export const sectorMask = (scene: Phaser.Scene, half: Half): Phaser.Display.Masks.GeometryMask => {
  const shape = scene.make.graphics({}, false);
  const top = half === 'bottom' ? LAYOUT.hingeY + LAYOUT.hingeHalf : LAYOUT.hingeY - LAYOUT.hingeHalf - FIELD.height;
  shape.fillStyle(0xffffff).fillRect(0, top, GAME_WIDTH, FIELD.height);
  return shape.createGeometryMask();
};

export type SectorHeader = {
  container: Phaser.GameObjects.Container;
  setStats: (bunkerHp: string, units: string) => void;
};

/** "● ENEMY SECTOR · Bunker HP 1000/1000 · Units 3/8" strip from the concept art. */
export const buildSectorHeader = (scene: Phaser.Scene, side: Side, y: number, title: string = TEAM[side].label): SectorHeader => {
  const team = TEAM[side];
  const container = scene.add.container(0, y);
  const plateKey = pickTexture(scene, 'ui_header_bar');
  if (scene.textures.exists(plateKey) && plateKey === 'ui_header_bar') {
    container.add(scene.add.image(GAME_WIDTH / 2, 0, plateKey).setDisplaySize(GAME_WIDTH, LAYOUT.headerHeight).setTint(team.light));
  } else {
    const g = scene.add.graphics();
    g.fillStyle(COLORS.panel, 0.95).fillRect(0, -LAYOUT.headerHeight / 2, GAME_WIDTH, LAYOUT.headerHeight);
    g.lineStyle(2, team.main, 0.8).lineBetween(0, LAYOUT.headerHeight / 2 - 1, GAME_WIDTH, LAYOUT.headerHeight / 2 - 1);
    container.add(g);
  }
  container.add(scene.add.rectangle(GAME_WIDTH / 2, 0, GAME_WIDTH, LAYOUT.headerHeight, 0x000000, 0.45));
  const dot = scene.add.circle(22, 0, 7, team.main);
  scene.tweens.add({ targets: dot, alpha: 0.35, duration: 700, yoyo: true, repeat: -1 });
  const style = { fontFamily: FONT, fontSize: '17px', color: team.css, stroke: '#000000', strokeThickness: 3 };
  const titleText = scene.add.text(38, 0, title, style).setOrigin(0, 0.5);
  const hp = scene.add.text(GAME_WIDTH / 2 + 40, 0, '', { ...style, color: '#e6edf7' }).setOrigin(0.5);
  const units = scene.add.text(GAME_WIDTH - 18, 0, '', { ...style, color: '#e6edf7' }).setOrigin(1, 0.5);
  container.add([dot, titleText, hp, units]);
  return {
    container,
    setStats: (bunkerHp, unitText) => {
      hp.setText(bunkerHp ? `BUNKER HP ${bunkerHp}` : '');
      units.setText(unitText);
    },
  };
};

export const buildHinge = (scene: Phaser.Scene): Phaser.GameObjects.Container => {
  const c = scene.add.container(GAME_WIDTH / 2, LAYOUT.hingeY);
  const key = pickTexture(scene, 'ui_hinge_bar', 'hinge');
  const img = scene.add.image(0, 0, key);
  img.setDisplaySize(GAME_WIDTH + 40, key === 'ui_hinge_bar' ? 64 : LAYOUT.hingeHalf * 2);
  c.add(img);
  return c;
};

export const teamText = (side: Side): string => hex(TEAM[side].main);
