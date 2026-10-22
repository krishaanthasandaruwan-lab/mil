import Phaser from 'phaser';
import { haptic, sfx } from '../audio/sfx';
import { pickTexture } from '../art/assets';
import { FULL_UNLOCK } from '../core/economy';
import type { MatchMode } from '../core/match';
import { UNLOCK_PRODUCT, buyProduct, isTestStore, priceOf, restorePurchases } from '../platform/purchases';
import { loadProfile } from '../core/profile';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, hex } from '../theme';
import { playSheet, sparks } from '../view/fx';
import { GameButton, label, panel, statChip } from './widgets';

/** Dark battlefield backdrop shared by the menu-side screens (store, armory, leagues). */
export const screenBackground = (scene: Phaser.Scene): void => {
  scene.cameras.main.setBackgroundColor(COLORS.bg);
  if (scene.textures.exists('bg_menu')) {
    const bg = scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg_menu');
    bg.setScale(Math.max(GAME_WIDTH / bg.width, GAME_HEIGHT / bg.height)).setAlpha(0.45);
  }
  scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x05080c, 0.72);
};

export type CurrencyBar = { refresh: () => void; coinTarget: Phaser.Math.Vector2; gemTarget: Phaser.Math.Vector2 };

/** Back button + title + live coin/gem counters. */
export const screenHeader = (scene: Phaser.Scene, title: string, onBack: () => void): CurrencyBar => {
  const g = scene.add.graphics().setDepth(50);
  g.fillStyle(0x000000, 0.75).fillRect(0, 0, GAME_WIDTH, 176);
  g.lineStyle(2, COLORS.cyan, 0.3).lineBetween(0, 176, GAME_WIDTH, 176);
  new GameButton(scene, 78, 56, 'BACK', { width: 130, skin: 'blue', fontSize: 18, onClick: onBack }).setDepth(51);
  label(scene, GAME_WIDTH / 2 + 30, 56, title, { size: 34, color: hex(COLORS.gold) }).setDepth(51);
  const coins = statChip(scene, 250, 134, 'icon_coin', '').setDepth(51);
  const gems = statChip(scene, 470, 134, 'icon_gem', '').setDepth(51);
  const refresh = (): void => {
    const p = loadProfile();
    (coins.getByName('value') as Phaser.GameObjects.Text).setText(`${p.coins}`);
    (gems.getByName('value') as Phaser.GameObjects.Text).setText(`${p.gems}`);
  };
  refresh();
  return { refresh, coinTarget: new Phaser.Math.Vector2(184, 134), gemTarget: new Phaser.Math.Vector2(404, 134) };
};

/** Only the browser build simulates purchases; the iOS app uses the App Store. */
export const testModeNote = (scene: Phaser.Scene, y = GAME_HEIGHT - 30): Phaser.GameObjects.Text | undefined =>
  isTestStore() ? label(scene, GAME_WIDTH / 2, y, 'TEST MODE · purchases are simulated, no real money is charged', { size: 14, color: '#8fa3bf' }) : undefined;

/** Modal dialog with a dimmed backdrop. Returns its root so callers can add content. */
export const modal = (scene: Phaser.Scene, w: number, h: number): Phaser.GameObjects.Container => {
  const root = scene.add.container(0, 0).setDepth(800);
  root.add(scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.75).setInteractive());
  root.add(panel(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2, w, h));
  root.setAlpha(0);
  scene.tweens.add({ targets: root, alpha: 1, duration: 180 });
  return root;
};

export const closeModal = (scene: Phaser.Scene, root: Phaser.GameObjects.Container): void => {
  scene.tweens.add({ targets: root, alpha: 0, duration: 160, onComplete: () => root.destroy() });
};

export const confirm = (scene: Phaser.Scene, text: string, okText: string, onOk: () => void): void => {
  const root = modal(scene, 600, 380);
  const cy = GAME_HEIGHT / 2;
  root.add(label(scene, GAME_WIDTH / 2, cy - 90, text, { size: 24, wrap: 520 }));
  root.add(label(scene, GAME_WIDTH / 2, cy - 10, 'TEST MODE · no real charge', { size: 15, color: '#8fa3bf' }));
  root.add(new GameButton(scene, GAME_WIDTH / 2 - 130, cy + 90, okText, { width: 240, skin: 'green', fontSize: 22, onClick: () => (closeModal(scene, root), onOk()) }));
  root.add(new GameButton(scene, GAME_WIDTH / 2 + 130, cy + 90, 'CANCEL', { width: 240, skin: 'red', fontSize: 22, onClick: () => closeModal(scene, root) }));
};

/** Coins or gems burst from a point and stream into a counter. */
export const rewardFly = (scene: Phaser.Scene, from: Phaser.Math.Vector2, to: Phaser.Math.Vector2, kind: 'coin' | 'gem', count: number, onDone?: () => void): void => {
  const layer = scene.add.container(0, 0).setDepth(900);
  const n = Math.max(3, Math.min(14, count));
  for (let i = 0; i < n; i++) {
    const sprite =
      kind === 'coin'
        ? playSheet(scene, layer, 'fx_coin_spin_sheet', from.x, from.y, { size: 44, frameRate: 26, loop: true })
        : undefined;
    const item = sprite ?? scene.add.image(from.x, from.y, pickTexture(scene, kind === 'coin' ? 'icon_coin' : 'icon_gem')).setDisplaySize(40, 40);
    if (!sprite) layer.add(item);
    const angle = Math.random() * Math.PI * 2;
    const spread = 60 + Math.random() * 80;
    scene.tweens.add({ targets: item, x: from.x + Math.cos(angle) * spread, y: from.y + Math.sin(angle) * spread, duration: 260, ease: 'Cubic.Out', delay: i * 30 });
    scene.tweens.add({
      targets: item,
      x: to.x,
      y: to.y,
      delay: 320 + i * 55,
      duration: 480,
      ease: 'Cubic.In',
      onComplete: () => {
        sfx.coin();
        item.destroy();
        if (i === n - 1) {
          layer.destroy();
          onDone?.();
        }
      },
    });
  }
};

const PAYWALL_REASON: Record<MatchMode | 'store', string> = {
  bot: "Today's free battles are used up. More tomorrow!",
  local: "Today's free face-to-face matches are used up.",
  online: 'Online battles are part of the Full Game.',
  store: 'Play without limits.',
};

/** Shown when today's free matches are used up, for online play, or from the store. */
export const showPaywall = (scene: Phaser.Scene, onUnlocked: () => void, reason: MatchMode | 'store' = 'store'): void => {
  const root = modal(scene, 640, 980);
  const cx = GAME_WIDTH / 2;
  const top = GAME_HEIGHT / 2 - 490;
  if (scene.textures.exists('store_full_unlock')) {
    const badge = scene.add.image(cx, top + 190, 'store_full_unlock');
    badge.setScale(260 / badge.height);
    root.add(badge);
    scene.tweens.add({ targets: badge, y: badge.y - 10, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  }
  root.add(label(scene, cx, top + 360, 'UNLOCK FULL GAME', { size: 40, color: hex(COLORS.gold) }));
  root.add(label(scene, cx, top + 412, PAYWALL_REASON[reason], { size: 21, color: '#cfe3ff', wrap: 560 }));
  const perks = ['Unlimited battles vs bots & friends', 'Online battles with Game Center', `+${FULL_UNLOCK.coins} coins to upgrade your army`, `+${FULL_UNLOCK.gems} gems for supply chests`];
  perks.forEach((t, i) => {
    root.add(label(scene, 120, top + 490 + i * 56, `✔  ${t}`, { size: 22, align: 'left', color: '#e6edf7' }));
  });
  root.add(
    new GameButton(scene, cx, top + 770, `UNLOCK · ${priceOf(UNLOCK_PRODUCT, FULL_UNLOCK.price)}`, {
      width: 460,
      skin: 'fold',
      fontSize: 28,
      onClick: async () => {
        const outcome = await buyProduct(UNLOCK_PRODUCT);
        if (outcome !== 'granted') {
          if (outcome === 'pending') confirm(scene, 'Your purchase is waiting for approval. It will unlock automatically.', 'OK', () => undefined);
          if (outcome === 'failed') confirm(scene, 'The App Store could not complete the purchase. Please try again.', 'OK', () => undefined);
          return;
        }
        sfx.victory();
        haptic([30, 30, 60]);
        sparks(scene, root, cx, top + 190, COLORS.gold, 40);
        playSheet(scene, root, 'fx_shockwave_sheet', cx, top + 190, { size: 500, frameRate: 24, add: true });
        scene.time.delayedCall(700, () => {
          closeModal(scene, root);
          onUnlocked();
        });
      },
    }),
  );
  if (isTestStore()) root.add(label(scene, cx, top + 850, 'TEST MODE · no real money is charged', { size: 14, color: '#8fa3bf' }));
  else {
    const restore = label(scene, cx, top + 850, 'Restore purchase', { size: 16, color: '#9fd2ff' }).setInteractive({ useHandCursor: true });
    restore.on('pointerup', async () => {
      if (await restorePurchases()) {
        closeModal(scene, root);
        onUnlocked();
      } else confirm(scene, 'No previous purchase found for this Apple ID.', 'OK', () => undefined);
    });
    root.add(restore);
  }
  const close = label(scene, cx + 280, top + 40, 'X', { size: 34, color: '#ff8080' }).setInteractive({ useHandCursor: true });
  close.on('pointerup', () => closeModal(scene, root));
  root.add(close);
};
