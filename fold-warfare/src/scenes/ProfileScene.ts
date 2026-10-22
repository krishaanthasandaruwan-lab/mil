import Phaser from 'phaser';
import { haptic, sfx } from '../audio/sfx';
import { pickTexture } from '../art/assets';
import { PRESET_AVATARS, loadPhotoTexture, pickPhoto, playerAvatarKey, storePhoto } from '../art/avatar';
import { MAX_LEVEL } from '../core/balance';
import { rankings } from '../core/leaderboard';
import { MAX_NAME_LENGTH, leagueFor, loadProfile, updateProfile, winRate, type UpgradeKey } from '../core/profile';
import { COLORS, GAME_WIDTH, TEAM, hex } from '../theme';
import { promptText } from '../ui/dom';
import { closeModal, modal, screenBackground, screenHeader } from '../ui/screen';
import { GameButton, label, panel } from '../ui/widgets';
import { sparks } from '../view/fx';
import { unitArt } from './GameScene';

const ARMY: UpgradeKey[] = ['tank', 'mortar', 'bomb', 'rocket', 'bunker'];

/** Commander profile: picture, name, league, career stats and army levels. */
export class ProfileScene extends Phaser.Scene {
  private root!: Phaser.GameObjects.Container;

  constructor() {
    super('Profile');
  }

  create(): void {
    this.cameras.main.fadeIn(200);
    screenBackground(this);
    screenHeader(this, 'PROFILE', () => this.scene.start('Menu'));
    this.root = this.add.container(0, 0);
    this.render();
  }

  private render(): void {
    this.root.removeAll(true);
    const p = loadProfile();
    const league = leagueFor(p.trophies);
    const avatarKey = playerAvatarKey(this, p);
    const rank = rankings(p, avatarKey).find((e) => e.isPlayer)?.rank ?? 0;

    // Identity card
    this.root.add(panel(this, GAME_WIDTH / 2, 380, 660, 340));
    const avatar = this.add.image(170, 360, avatarKey).setDisplaySize(190, 190);
    const frame = this.add.graphics();
    frame.lineStyle(4, TEAM.P1.main, 1).strokeRect(avatar.x - 95, avatar.y - 95, 190, 190);
    this.root.add([avatar, frame]);
    this.root.add(new GameButton(this, 170, 500, 'CHANGE PICTURE', { width: 220, skin: 'blue', fontSize: 16, onClick: () => this.chooseAvatar() }));
    this.root.add(label(this, 300, 262, p.name.toUpperCase(), { size: 30, align: 'left' }));
    this.root.add(new GameButton(this, 590, 262, 'EDIT', { width: 100, skin: 'blue', fontSize: 15, onClick: () => void this.editName() }));
    const badge = this.add.image(330, 340, pickTexture(this, `league_${league.name.toLowerCase()}`, 'icon_trophy'));
    badge.setScale(70 / badge.height);
    this.root.add(badge);
    this.root.add(label(this, 378, 322, `${league.name.toUpperCase()} LEAGUE`, { size: 20, align: 'left', color: hex(league.color) }));
    this.root.add(this.add.image(392, 356, pickTexture(this, 'icon_trophy')).setDisplaySize(28, 28));
    this.root.add(label(this, 412, 356, `${p.trophies}`, { size: 22, align: 'left', color: '#ffd38a' }));
    this.root.add(label(this, 300, 418, `WORLD RANK #${rank}`, { size: 18, align: 'left', color: hex(COLORS.cyan) }));
    this.root.add(label(this, 300, 452, p.unlocked ? 'FULL GAME' : 'FREE TRIAL', { size: 15, align: 'left', color: p.unlocked ? '#3ddc6b' : '#ffd38a' }));

    // Career stats
    this.root.add(label(this, GAME_WIDTH / 2, 600, 'CAREER', { size: 22, color: hex(COLORS.gold) }));
    const stats: [string, string][] = [
      ['BATTLES', `${p.matches}`],
      ['WINS', `${p.wins}`],
      ['LOSSES', `${p.losses}`],
      ['WIN RATE', `${winRate(p)}%`],
      ['BEST TROPHIES', `${p.bestTrophies}`],
      ['3-STAR WINS', `${p.threeStarWins}`],
    ];
    stats.forEach(([name, value], i) => {
      const x = 145 + (i % 3) * 215;
      const y = 680 + Math.floor(i / 3) * 112;
      const g = this.add.graphics();
      g.fillStyle(0x000000, 0.55).fillRoundedRect(x - 98, y - 44, 196, 92, 12);
      g.lineStyle(1, COLORS.steel, 0.8).strokeRoundedRect(x - 98, y - 44, 196, 92, 12);
      this.root.add([g, label(this, x, y - 14, value, { size: 30 }), label(this, x, y + 24, name, { size: 13, color: '#8fa3bf' })]);
    });

    // Army levels
    this.root.add(label(this, GAME_WIDTH / 2, 912, 'ARMY', { size: 22, color: hex(COLORS.gold) }));
    ARMY.forEach((key, i) => {
      const x = 104 + i * 128;
      const y = 1010;
      const g = this.add.graphics();
      g.fillStyle(0x000000, 0.55).fillRoundedRect(x - 56, y - 64, 112, 140, 12);
      const art = this.add.image(x, y - 14, key === 'bunker' ? pickTexture(this, 'bunker_blue_intact', 'bunker_P1') : unitArt(this, key, 'P1'));
      art.setScale(Math.min(90 / art.width, 70 / art.height));
      const pips = this.add.graphics();
      for (let l = 0; l < MAX_LEVEL; l++) pips.fillStyle(l < p.levels[key] ? COLORS.gold : 0x2a3340, 1).fillRoundedRect(x - 44 + l * 18, y + 38, 14, 8, 3);
      this.root.add([g, art, pips, label(this, x, y + 60, `LV ${p.levels[key]}`, { size: 14 })]);
    });
    this.root.add(new GameButton(this, GAME_WIDTH / 2, 1170, 'UPGRADE IN ARMORY', { width: 340, skin: 'green', fontSize: 18, onClick: () => this.scene.start('Armory') }));
  }

  private async editName(): Promise<void> {
    const name = await promptText('Commander name', loadProfile().name, MAX_NAME_LENGTH);
    if (!name) return;
    updateProfile((p) => {
      p.name = name.slice(0, MAX_NAME_LENGTH);
    });
    sfx.select();
    this.render();
  }

  private chooseAvatar(): void {
    const root = modal(this, 640, 760);
    const top = 300;
    root.add(label(this, GAME_WIDTH / 2, top, 'CHOOSE YOUR PICTURE', { size: 26, color: hex(COLORS.gold) }));
    const current = loadProfile().avatar;
    PRESET_AVATARS.filter((k) => this.textures.exists(k)).forEach((key, i) => {
      const x = 165 + (i % 4) * 130;
      const y = top + 110 + Math.floor(i / 4) * 140;
      const img = this.add.image(x, y, key).setDisplaySize(110, 110).setInteractive({ useHandCursor: true });
      const ring = this.add.graphics();
      ring.lineStyle(current === key ? 4 : 1, current === key ? COLORS.gold : COLORS.steel, 1).strokeRect(x - 55, y - 55, 110, 110);
      img.on('pointerup', () => {
        updateProfile((p) => {
          p.avatar = key;
        });
        sfx.select();
        closeModal(this, root);
        this.render();
      });
      root.add([img, ring]);
    });
    root.add(
      new GameButton(this, GAME_WIDTH / 2, top + 420, 'UPLOAD A PHOTO', {
        width: 360,
        skin: 'green',
        fontSize: 20,
        onClick: () => void this.uploadPhoto(root),
      }),
    );
    root.add(label(this, GAME_WIDTH / 2, top + 480, 'Your photo stays on this device. It is never uploaded.', { size: 14, color: '#8fa3bf' }));
    root.add(new GameButton(this, GAME_WIDTH / 2, top + 560, 'CANCEL', { width: 240, skin: 'red', fontSize: 18, onClick: () => closeModal(this, root) }));
  }

  private async uploadPhoto(root: Phaser.GameObjects.Container): Promise<void> {
    const dataUrl = await pickPhoto();
    if (!dataUrl) return;
    if (!storePhoto(dataUrl)) {
      sfx.invalid();
      return;
    }
    await loadPhotoTexture(this, dataUrl);
    updateProfile((p) => {
      p.avatar = 'photo';
    });
    sfx.victory();
    haptic(20);
    closeModal(this, root);
    this.render();
    sparks(this, this.root, 170, 360, COLORS.gold, 20);
  }
}
