import Phaser from 'phaser';
import { haptic, sfx } from '../audio/sfx';
import { pickTexture } from '../art/assets';
import { BUNKER, MAX_LEVEL, UNITS, levelMultiplier } from '../core/balance';
import { tryUpgrade, upgradeCost } from '../core/economy';
import { loadProfile, updateProfile, type UpgradeKey } from '../core/profile';
import { COLORS, GAME_WIDTH, hex } from '../theme';
import { confirm, screenBackground, screenHeader, type CurrencyBar } from '../ui/screen';
import { GameButton, label, panel } from '../ui/widgets';
import { playSheet, sparks } from '../view/fx';
import { unitArt } from './GameScene';

const ROWS: UpgradeKey[] = ['tank', 'mortar', 'bomb', 'rocket', 'bunker'];

const statsAt = (key: UpgradeKey, level: number): { hp: number; atk: number } => {
  const m = levelMultiplier(level);
  if (key === 'bunker') return { hp: Math.round(BUNKER.hp * m), atk: Math.round(BUNKER.turretAtk * m) };
  return { hp: Math.round(UNITS[key].hp * m), atk: Math.round(UNITS[key].atk * m) };
};

const nameOf = (key: UpgradeKey): string => (key === 'bunker' ? 'Main Bunker' : UNITS[key].name);

/** Clash-of-Clans style upgrade hall: each level adds +20% HP and attack. */
export class ArmoryScene extends Phaser.Scene {
  private list!: Phaser.GameObjects.Container;
  private bar!: CurrencyBar;

  constructor() {
    super('Armory');
  }

  create(): void {
    this.cameras.main.fadeIn(200);
    screenBackground(this);
    this.bar = screenHeader(this, 'ARMORY', () => this.scene.start('Menu'));
    label(this, GAME_WIDTH / 2, 214, 'Each level: +20% HP and attack', { size: 18, color: '#8fa3bf' });
    this.list = this.add.container(0, 0);
    this.render();
  }

  private render(highlight?: UpgradeKey): void {
    this.list.removeAll(true);
    const profile = loadProfile();
    ROWS.forEach((key, i) => {
      const y = 330 + i * 186;
      const level = profile.levels[key];
      const cost = upgradeCost(level);
      const now = statsAt(key, level);
      const next = statsAt(key, Math.min(MAX_LEVEL, level + 1));

      const card = panel(this, GAME_WIDTH / 2, y, 660, 172);
      const artKey = key === 'bunker' ? pickTexture(this, 'bunker_blue_intact', 'bunker_P1') : unitArt(this, key, 'P1');
      const art = this.add.image(120, y + 4, artKey);
      art.setScale(Math.min(150 / art.width, 130 / art.height));
      const title = label(this, 210, y - 50, `${nameOf(key).toUpperCase()}`, { size: 24, align: 'left' });
      const lvl = label(this, 210, y - 16, `LEVEL ${level}`, { size: 18, align: 'left', color: hex(COLORS.gold) });
      const pips = this.add.graphics();
      for (let p = 0; p < MAX_LEVEL; p++) {
        pips.fillStyle(p < level ? COLORS.gold : 0x2a3340, 1).fillRoundedRect(320 + p * 26, y - 24, 20, 14, 4);
      }
      const fmt = (name: string, a: number, b: number): string => (cost ? `${name} ${a} > ${b}` : `${name} ${a}`);
      const statLine = key === 'bomb' ? fmt('BLAST', now.atk, next.atk) : `${fmt('HP', now.hp, next.hp)}    ${fmt('ATK', now.atk, next.atk)}`;
      const stats = label(this, 210, y + 28, statLine, { size: 17, align: 'left', color: '#9fd2ff' });
      this.list.add([card, art, title, lvl, pips, stats]);

      if (cost === undefined) {
        this.list.add(label(this, 590, y + 4, 'MAX', { size: 30, color: hex(COLORS.gold) }));
      } else {
        const affordable = profile.coins >= cost;
        const btn = new GameButton(this, 584, y + 4, `${cost}`, {
          width: 170,
          skin: affordable ? 'green' : 'red',
          fontSize: 22,
          icon: pickTexture(this, 'icon_coin'),
          onClick: () => this.upgrade(key),
        });
        this.list.add(btn);
      }
      if (key === highlight) {
        this.tweens.add({ targets: art, scale: art.scale * 1.18, duration: 160, yoyo: true, ease: 'Back.Out' });
        sparks(this, this.list, art.x, art.y, COLORS.gold, 30);
        playSheet(this, this.list, 'fx_deploy_sheet', art.x, art.y - 30, { size: 220, frameRate: 30, add: true, tint: COLORS.gold });
      }
    });
  }

  private upgrade(key: UpgradeKey): void {
    const profile = loadProfile();
    const result = tryUpgrade(profile, key);
    if (!result.ok) {
      sfx.invalid();
      if (result.reason === 'coins') confirm(this, 'Not enough coins! Visit the store?', 'STORE', () => this.scene.start('Store', { tab: 'coins' }));
      return;
    }
    updateProfile((p) => Object.assign(p, profile));
    sfx.victory();
    haptic([20, 30, 50]);
    this.bar.refresh();
    this.render(key);
  }
}
