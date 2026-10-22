import Phaser from 'phaser';

export type ScrollArea = {
  content: Phaser.GameObjects.Container;
  /** Drag surface in screen space. */
  zone: Phaser.GameObjects.Zone;
  setContentHeight: (h: number) => void;
  scrollTo: (y: number) => void;
  destroy: () => void;
};

let nextOffset = 10_000;

/**
 * Drag- and wheel-scrollable region. The content lives far off to the side of the world and a dedicated
 * camera shows it inside the (x, y, w, h) window — exact clipping at the cost of one extra camera,
 * instead of a stencil mask per row. Lay content out from (0, 0) downward.
 */
export const scrollArea = (scene: Phaser.Scene, x: number, y: number, w: number, h: number): ScrollArea => {
  const worldX = nextOffset;
  nextOffset += 4000;
  const content = scene.add.container(worldX, 0);
  const cam = scene.cameras.add(x, y, w, h).setScroll(worldX, 0);

  let contentHeight = h;
  let offset = 0;
  const clamp = (v: number): number => Phaser.Math.Clamp(v, Math.min(0, h - contentHeight), 0);
  const apply = (v: number): void => {
    offset = clamp(v);
    cam.scrollY = -offset;
  };

  const zone = scene.add.zone(x, y, w, h).setOrigin(0, 0).setInteractive();
  let dragStart: { pointerY: number; offset: number } | undefined;
  zone.on('pointerdown', (p: Phaser.Input.Pointer) => {
    dragStart = { pointerY: p.y, offset };
  });
  const onMove = (p: Phaser.Input.Pointer): void => {
    if (dragStart && p.isDown) apply(dragStart.offset + (p.y - dragStart.pointerY));
  };
  const onUp = (): void => {
    dragStart = undefined;
  };
  scene.input.on('pointermove', onMove);
  scene.input.on('pointerup', onUp);
  zone.on('wheel', (_p: Phaser.Input.Pointer, _dx: number, dy: number) => apply(offset - dy));

  return {
    content,
    zone,
    setContentHeight: (value) => {
      contentHeight = Math.max(h, value);
      apply(offset);
    },
    scrollTo: (value) => apply(-value),
    destroy: () => {
      scene.input.off('pointermove', onMove);
      scene.input.off('pointerup', onUp);
      scene.cameras.remove(cam);
      zone.destroy();
      content.destroy();
    },
  };
};
