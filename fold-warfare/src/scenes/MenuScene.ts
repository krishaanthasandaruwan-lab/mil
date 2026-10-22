import Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { pickTexture } from '../art/assets';
import { playerAvatarKey } from '../art/avatar';
import { canStartMatch, freeMatchesLeft } from '../core/economy';
import { FREE_PER_DAY, botDifficultyFor, leagueFor, loadProfile, rollOpponent } from '../core/profile';
import type { UnitType } from '../core/types';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, TEAM, hex } from '../theme';
import { showPaywall } from '../ui/screen';
import type { GameSceneData } from './GameScene';
import { GameButton, label, panel, statChip } from '../ui/widgets';
import { UnitView } from '../view/UnitView';

export class MenuScene extends Phaser.Scene {
  private openHowTo = false;

  constructor() {
    super('Menu');
  }

  init(data: { showHowTo?: boolean }): void {
    this.openHowTo = data.showHowTo ?? false;
  }

  create(): void {
    const profile = loadProfile();
    sfx.music('menu');
    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.cameras.main.fadeIn(300);

    this.buildBackground();
    this.buildTopBar(profile.trophies, profile.coins, profile.gems);
    this.buildLogo();
    this.buildTiles(profile.trophies);

    new GameButton(this, GAME_WIDTH / 2, 800, 'BATTLE', {
      width: 470,
      skin: 'fold',
      fontSize: 40,
      onClick: () => {
        const p = loadProfile();
        this.go({ mode: 'bot', opponent: rollOpponent(p.trophies), difficulty: botDifficultyFor(p.trophies) });
      },
    });
    label(
      this,
      GAME_WIDTH / 2,
      888,
      profile.unlocked
        ? 'FULL GAME UNLOCKED'
        : `FREE TODAY: ${freeMatchesLeft(profile, 'bot')}/${FREE_PER_DAY.bot} BATTLES · ${freeMatchesLeft(profile, 'local')}/${FREE_PER_DAY.local} FACE TO FACE`,
      { size: 17, color: profile.unlocked ? '#3ddc6b' : '#ffd38a' },
    );
    new GameButton(this, GAME_WIDTH / 2, 960, profile.unlocked ? 'ONLINE · GAME CENTER' : 'ONLINE · FULL GAME ONLY', {
      width: 470,
      skin: 'gold',
      fontSize: 22,
      onClick: () => (loadProfile().unlocked ? this.open('Online') : showPaywall(this, () => this.scene.restart(), 'online')),
    });
    new GameButton(this, GAME_WIDTH / 2, 1044, '2 PLAYERS · FACE TO FACE', {
      width: 470,
      skin: 'blue',
      fontSize: 22,
      onClick: () => this.go({ mode: 'local', opponent: { name: 'Player 2', trophies: 0 }, difficulty: 'veteran' }),
    });
    new GameButton(this, GAME_WIDTH / 2, 1128, 'HOW TO PLAY', { width: 320, skin: 'green', fontSize: 22, onClick: () => this.showHowTo() });
    label(this, GAME_WIDTH / 2, 1236, `WINS ${profile.wins}  ·  LOSSES ${profile.losses}`, { size: 16, color: '#8fa3bf' });
    if (this.openHowTo) this.showHowTo();
  }

  private buildBackground(): void {
    if (this.textures.exists('bg_menu')) {
      const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg_menu');
      bg.setScale(Math.max(GAME_WIDTH / bg.width, GAME_HEIGHT / bg.height));
      this.tweens.add({ targets: bg, scale: bg.scale * 1.06, duration: 14000, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    } else {
      this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, pickTexture(this, 'env_ground_tile', 'field_bottom')).setOrigin(0, 0);
    }
    const g = this.add.graphics();
    g.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.75, 0.75, 0, 0);
    g.fillRect(0, 0, GAME_WIDTH, 460);
    g.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.85, 0.85);
    g.fillRect(0, 760, GAME_WIDTH, GAME_HEIGHT - 760);
  }

  private buildTopBar(trophies: number, coins: number, gems: number): void {
    // Tap your picture for the Profile page; the gear opens Settings.
    const avatar = this.add.image(46, 50, playerAvatarKey(this, loadProfile())).setDisplaySize(64, 64).setInteractive({ useHandCursor: true });
    this.add.graphics().lineStyle(2, TEAM.P1.main, 1).strokeRect(avatar.x - 32, avatar.y - 32, 64, 64);
    avatar.on('pointerup', () => this.open('Profile'));
    statChip(this, 178, 50, 'icon_trophy', `${trophies}`);
    statChip(this, 340, 50, 'icon_coin', `${coins}`);
    statChip(this, 502, 50, 'icon_gem', `${gems}`);
    const gear = this.add.image(GAME_WIDTH - 42, 50, pickTexture(this, 'icon_settings', 'icon_sound')).setDisplaySize(52, 52).setInteractive({ useHandCursor: true });
    gear.on('pointerup', () => this.open('Settings'));
  }

  private open(scene: string): void {
    sfx.unlock();
    sfx.click();
    this.cameras.main.fadeOut(160);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(scene));
  }

  /** ARMORY / STORE / TOP PLAYERS / LEAGUES shortcuts. */
  private buildTiles(trophies: number): void {
    const league = leagueFor(trophies);
    const tiles = [
      { title: 'ARMORY', image: pickTexture(this, 'tank_blue_idle_ne', 'tank_body_P1'), scene: 'Armory' },
      { title: 'STORE', image: pickTexture(this, 'store_chest_closed', 'store_chest_open', 'icon_coin'), scene: 'Store' },
      { title: 'RANKING', image: pickTexture(this, 'icon_trophy'), scene: 'Leaderboard' },
      { title: league.name.toUpperCase(), image: pickTexture(this, `league_${league.name.toLowerCase()}`, 'icon_trophy'), scene: 'Leagues' },
    ];
    tiles.forEach((t, i) => {
      const x = 102 + i * 172;
      const y = 570;
      const c = this.add.container(x, y);
      c.add(panel(this, 0, 0, 160, 170));
      const img = this.add.image(0, -14, t.image);
      img.setScale(Math.min(104 / img.width, 96 / img.height));
      c.add(img);
      c.add(label(this, 0, 60, t.title, { size: 17, color: i === 3 ? hex(league.color) : '#ffffff' }));
      c.setSize(160, 170).setInteractive({ useHandCursor: true });
      c.on('pointerdown', () => this.tweens.add({ targets: c, scale: 0.94, duration: 70 }));
      c.on('pointerout', () => this.tweens.add({ targets: c, scale: 1, duration: 120 }));
      c.on('pointerup', () => this.open(t.scene));
      c.setScale(0);
      this.tweens.add({ targets: c, scale: 1, delay: 300 + i * 90, duration: 380, ease: 'Back.Out' });
    });
  }

  private buildLogo(): void {
    const y = 240;
    if (this.textures.exists('logo')) {
      const logo = this.add.image(GAME_WIDTH / 2, y, 'logo');
      const base = 540 / logo.width;
      logo.setScale(0);
      this.tweens.add({ targets: logo, scale: base, duration: 600, ease: 'Back.Out' });
    } else {
      label(this, GAME_WIDTH / 2, y - 40, 'FOLD', { size: 110, color: hex(COLORS.gold) });
      label(this, GAME_WIDTH / 2, y + 60, 'WARFARE', { size: 84 });
    }
    label(this, GAME_WIDTH / 2, y + 140, 'PLACE · FOLD · CLASH', { size: 22, color: '#5ff3ff' });
  }

  private go(data: GameSceneData): void {
    sfx.unlock();
    if (!canStartMatch(loadProfile(), data.mode)) {
      showPaywall(this, () => this.scene.restart(), data.mode);
      return;
    }
    this.cameras.main.fadeOut(220);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Game', data));
  }

  private showHowTo(): void {
    const c = this.add.container(0, 0).setDepth(100);
    c.add(this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.85).setInteractive());
    c.add(panel(this, GAME_WIDTH / 2, 640, 680, 1160));
    c.add(label(this, GAME_WIDTH / 2, 120, 'HOW TO PLAY', { size: 36, color: hex(COLORS.gold) }));

    const steps = [
      '1. Place your BUNKER anywhere in your sector.',
      '2. Take turns deploying units: press, drag to aim, release.',
      '3. FOLD. Your sector flips onto the enemy sector — there is no grid, judge where your units will land.',
      '4. Units that land on enemy units CRASH. Survivors then fire at anything in range.',
      'Destroy the enemy bunker = 3 stars.',
    ];
    // Text stays inside the panel's inner frame (about x 80..630).
    steps.forEach((s, i) => c.add(label(this, 84, 196 + i * 64, s, { size: 18, align: 'left', wrap: 540 })));

    c.add(label(this, GAME_WIDTH / 2, 545, 'THE CRASH RULE', { size: 24, color: hex(COLORS.cyan) }));
    const rows: { left: [UnitType, number]; right: [UnitType, number]; result: string; color: number }[] = [
      { left: ['tank', 2], right: ['mortar', 1], result: 'Higher level wins', color: COLORS.gold },
      { left: ['rocket', 1], right: ['tank', 1], result: 'Same level: both destroyed', color: COLORS.orange },
      { left: ['bomb', 1], right: ['mortar', 1], result: 'Mine blasts it, and anything near, even your own bunker', color: COLORS.purple },
    ];
    rows.forEach((row, i) => {
      const y = 640 + i * 150;
      const a = new UnitView(this, 140, y, { side: 'P1', kind: row.left[0] }, 'ne');
      const b = new UnitView(this, 280, y, { side: 'P2', kind: row.right[0] }, 'sw');
      c.add([a, b]);
      c.add(label(this, 140, y + 48, `LV ${row.left[1]}`, { size: 16, color: TEAM.P1.css }));
      c.add(label(this, 280, y + 48, `LV ${row.right[1]}`, { size: 16, color: TEAM.P2.css }));
      c.add(label(this, 210, y, 'VS', { size: 20, color: '#8fa3bf' }));
      c.add(label(this, 360, y, row.result, { size: 18, align: 'left', color: hex(row.color), wrap: 250 }));
    });
    c.add(label(this, GAME_WIDTH / 2, 1070, 'Overcharge = +1 level in a crash. Upgrade units in the Armory.', { size: 16, color: '#cfe3ff', wrap: 520 }));

    c.add(new GameButton(this, GAME_WIDTH / 2, 1160, 'GOT IT', { width: 280, skin: 'green', fontSize: 22, onClick: () => c.destroy() }));
    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 200 });
  }
}
