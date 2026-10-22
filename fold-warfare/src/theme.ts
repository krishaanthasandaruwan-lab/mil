import { FIELD } from './core/balance';
import type { Point, Side } from './core/types';

export const GAME_WIDTH = 720;
export const GAME_HEIGHT = 1280;

export const FONT = '"Russo One", "Arial Black", sans-serif';
export const FONT_BODY = '"Rajdhani", "Arial", sans-serif';

export const COLORS = {
  bg: 0x0a0e14,
  bgDeep: 0x05080c,
  panel: 0x0f1620,
  outline: 0x05070a,
  steel: 0x2a3340,
  gold: 0xffc83d,
  orange: 0xff7a1a,
  green: 0x3ddc6b,
  blueUi: 0x2e9bff,
  purple: 0xb070ff,
  cyan: 0x5ff3ff,
  white: 0xffffff,
  danger: 0xff3b3b,
  text: 0xe6edf7,
  muted: 0x8fa3bf,
} as const;

export const TEAM = {
  P1: { main: 0x2e9bff, dark: 0x0f3f7a, light: 0x9fd2ff, css: '#2e9bff', art: 'blue', label: 'ALLY SECTOR' },
  P2: { main: 0xff3b3b, dark: 0x7a1414, light: 0xffa3a3, css: '#ff3b3b', art: 'red', label: 'ENEMY SECTOR' },
} as const satisfies Record<Side, { main: number; dark: number; light: number; css: string; art: string; label: string }>;

export const hex = (color: number): string => `#${color.toString(16).padStart(6, '0')}`;

export type LayoutMode = 'standard' | 'duel';

type Layout = {
  fieldX: number;
  topBarHeight: number;
  hingeY: number;
  hingeHalf: number;
  headerHeight: number;
  trayY: number;
};

/**
 * Standard (vs bot), top to bottom: HUD, enemy header, enemy field, hinge, your field, your header, tray.
 * Duel (2 players face to face): Player 2's tray (turned toward them), their field, hinge, your field, your tray.
 * Both fields always mirror each other across the hinge, so the fold is a single flip of the bottom half.
 */
const LAYOUTS: Record<LayoutMode, Layout> = {
  standard: { fieldX: (GAME_WIDTH - FIELD.width) / 2, topBarHeight: 76, hingeY: 580, hingeHalf: 24, headerHeight: 40, trayY: 1084 },
  duel: { fieldX: (GAME_WIDTH - FIELD.width) / 2, topBarHeight: 0, hingeY: 640, hingeHalf: 24, headerHeight: 0, trayY: 1104 },
};

/** Live layout; every helper reads it at call time, so switching modes re-flows the whole screen. */
export const LAYOUT: Layout = { ...LAYOUTS.standard };

export const setLayout = (mode: LayoutMode): void => {
  Object.assign(LAYOUT, LAYOUTS[mode]);
};

/** Field position -> screen position. The top half is the mirror image of the bottom half. */
export const toScreen = (p: Point, half: 'top' | 'bottom'): Point => {
  const offset = LAYOUT.hingeHalf + p.y;
  return { x: LAYOUT.fieldX + p.x, y: half === 'bottom' ? LAYOUT.hingeY + offset : LAYOUT.hingeY - offset };
};

/** Screen position -> field position on the given half, or undefined when outside that half. */
export const toField = (x: number, y: number, half: 'top' | 'bottom'): Point | undefined => {
  const fx = x - LAYOUT.fieldX;
  const fy = half === 'bottom' ? y - LAYOUT.hingeY - LAYOUT.hingeHalf : LAYOUT.hingeY - LAYOUT.hingeHalf - y;
  if (fx < 0 || fx > FIELD.width || fy < 0 || fy > FIELD.height) return undefined;
  return { x: fx, y: fy };
};

export const sideArt = (side: Side): string => TEAM[side].art;
