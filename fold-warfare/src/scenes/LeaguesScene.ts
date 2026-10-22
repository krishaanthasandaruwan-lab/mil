import Phaser from 'phaser';
import { pickTexture } from '../art/assets';
import { LEAGUES, leagueFor, loadProfile } from '../core/profile';
import { COLORS, GAME_WIDTH, hex } from '../theme';
import { screenBackground, screenHeader } from '../ui/screen';
import { label, panel } from '../ui/widgets';
import { sparks } from '../view/fx';

/** Trophy road: every league badge, where you are, and how far to the next one. */
export class LeaguesScene extends Phaser.Scene {
  constructor() {
    super('Leagues');
  }

  create(): void {
    this.cameras.main.fadeIn(200);
    screenBackground(this);
    screenHeader(this, 'LEAGUES', () => this.scene.start('Menu'));
    const { trophies } = loadProfile();
    const current = leagueFor(trophies);
    const idx = LEAGUES.findIndex((l) => l.name === current.name);
    const next = LEAGUES[idx + 1];

    panel(this, GAME_WIDTH / 2, 360, 660, 300);
    const badge = this.add.image(170, 360, pickTexture(this, `league_${current.name.toLowerCase()}`, 'icon_trophy'));
    badge.setScale(210 / badge.height);
    this.tweens.add({ targets: badge, y: 350, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    sparks(this, this.add.container(0, 0), badge.x, badge.y, current.color, 24);
    label(this, 300, 290, `${current.name.toUpperCase()} LEAGUE`, { size: 32, align: 'left', color: hex(current.color) });
    this.add.image(318, 350, pickTexture(this, 'icon_trophy')).setDisplaySize(40, 40);
    label(this, 346, 350, `${trophies}`, { size: 30, align: 'left' });

    const barX = 300;
    const barW = 360;
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.8).fillRoundedRect(barX, 396, barW, 20, 10);
    const frac = next ? Math.min(1, (trophies - current.min) / (next.min - current.min)) : 1;
    g.fillStyle(current.color, 1).fillRoundedRect(barX + 2, 398, Math.max(12, (barW - 4) * frac), 16, 8);
    label(this, barX, 438, next ? `${next.min - trophies} trophies to ${next.name.toUpperCase()}` : 'Top league reached!', { size: 17, align: 'left', color: '#cfe3ff' });

    LEAGUES.slice()
      .reverse()
      .forEach((league, i) => {
        const y = 560 + i * 96;
        const reached = trophies >= league.min;
        const isCurrent = league.name === current.name;
        const row = this.add.graphics();
        row.fillStyle(isCurrent ? league.color : 0x000000, isCurrent ? 0.25 : 0.55).fillRoundedRect(40, y - 42, GAME_WIDTH - 80, 84, 16);
        row.lineStyle(2, isCurrent ? league.color : COLORS.steel, isCurrent ? 1 : 0.6).strokeRoundedRect(40, y - 42, GAME_WIDTH - 80, 84, 16);
        const icon = this.add.image(100, y, pickTexture(this, `league_${league.name.toLowerCase()}`, 'icon_trophy'));
        icon.setScale(72 / icon.height).setAlpha(reached ? 1 : 0.35);
        label(this, 160, y, league.name.toUpperCase(), { size: 26, align: 'left', color: reached ? hex(league.color) : '#5a6676' });
        label(this, GAME_WIDTH - 70, y, `${league.min}+`, { size: 22, align: 'right', color: reached ? '#ffffff' : '#5a6676' });
        if (isCurrent) label(this, GAME_WIDTH / 2 + 60, y, 'YOU ARE HERE', { size: 16, color: hex(COLORS.gold) });
        if (!reached) this.add.image(GAME_WIDTH - 200, y, pickTexture(this, 'icon_lock', 'icon_star_empty')).setDisplaySize(40, 40).setAlpha(0.7);
      });
  }
}
