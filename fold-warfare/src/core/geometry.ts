import { FIELD } from './balance';
import type { Point } from './types';

export const distance = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y);

/** True when a circle of `radius` at `p` sits fully on the field. */
export const fitsOnField = (p: Point, radius: number): boolean =>
  p.x >= radius && p.x <= FIELD.width - radius && p.y >= radius && p.y <= FIELD.height - radius;

export const clampToField = (p: Point, radius: number): Point => ({
  x: Math.min(FIELD.width - radius, Math.max(radius, p.x)),
  y: Math.min(FIELD.height - radius, Math.max(radius, p.y)),
});
