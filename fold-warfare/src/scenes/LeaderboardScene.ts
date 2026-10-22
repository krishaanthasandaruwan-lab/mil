import Phaser from 'phaser';
import { pickTexture } from '../art/assets';
import { playerAvatarKey } from '../art/avatar';
import { SEASON, rankings, type RankEntry } from '../core/leaderboard';
import { LEAGUES, loadProfile } from '../core/profile';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, TEAM, hex } from '../theme';
import { screenBackground, screenHeader } from '../ui/screen';
import { scrollArea } from '../ui/scroll';
import { GameButton, label } from '../ui/widgets';
import { gcPlayer, showGlobalLeaderboard } from '../platform/gamecenter';

const PODIUM_COLORS = [0xffc83d, 0xc9d3dd, 0xcd7f32];
const ROW_H = 78;
const LIST_TOP = 560;
const LIST_BOTTOM = GAME_HEIGHT - 110;

const leagueColor = (name: string): number => LEAGUES.find((l) => l.name === name)?.color ?? COLORS.text;

/** Top Players: podium for the top 3, scrollable ladder, and your own rank pinned at the bottom. */
export class LeaderboardScene extends Phaser.Scene {
  constructor() {
    super('Leaderboard');
  }

  create(): void {
    this.cameras.main.fadeIn(200);
    screenBackground(this);
    screenHeader(this, 'TOP PLAYERS', () => this.scene.start('Menu'));
    label(this, GAME_WIDTH / 2, 206, `SEASON ${SEASON} · OFFLINE RANKINGS`, { size: 16, color: '#8fa3bf' });
    if (gcPlayer().authenticated) {
      new GameButton(this, GAME_WIDTH - 110, 206, 'GAME CENTER', { width: 180, skin: 'gold', fontSize: 14, onClick: () => void showGlobalLeaderboard() }).setDepth(30);
    }

    const profile = loadProfile();
    const board = rankings(profile, playerAvatarKey(this, profile));
    board.slice(0, 3).forEach((entry, i) => this.podium(entry, i));
    this.list(board.slice(3));
    const me = board.find((e) => e.isPlayer);
    if (me) this.pinnedRow(me);
  }

  private podium(entry: RankEntry, place: number): void {
    const x = [GAME_WIDTH / 2, GAME_WIDTH / 2 - 210, GAME_WIDTH / 2 + 210][place] ?? GAME_WIDTH / 2;
    const y = [360, 390, 390][place] ?? 390;
    const size = place === 0 ? 128 : 104;
    const color = PODIUM_COLORS[place] ?? COLORS.text;
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.55).fillRoundedRect(x - 95, y - size / 2 - 20, 190, size + 150, 16);
    g.lineStyle(2, color, 0.8).strokeRoundedRect(x - 95, y - size / 2 - 20, 190, size + 150, 16);
    const avatar = this.add.image(x, y, pickTexture(this, entry.avatar, 'avatar_player')).setDisplaySize(size, size);
    g.lineStyle(4, color, 1).strokeRect(avatar.x - size / 2, avatar.y - size / 2, size, size);
    label(this, x, y - size / 2 - 4, `#${place + 1}`, { size: 22, color: hex(color) });
    label(this, x, y + size / 2 + 26, entry.name.toUpperCase(), { size: 18, color: entry.isPlayer ? TEAM.P1.css : '#ffffff' });
    this.add.image(x - 34, y + size / 2 + 60, pickTexture(this, 'icon_trophy')).setDisplaySize(26, 26);
    label(this, x - 16, y + size / 2 + 60, `${entry.trophies}`, { size: 20, align: 'left', color: '#ffd38a' });
    label(this, x, y + size / 2 + 92, entry.league.toUpperCase(), { size: 14, color: hex(leagueColor(entry.league)) });
  }

  private row(parent: Phaser.GameObjects.Container, entry: RankEntry, y: number): void {
    const g = this.add.graphics();
    const highlight = entry.isPlayer;
    g.fillStyle(highlight ? TEAM.P1.main : 0x000000, highlight ? 0.28 : 0.5).fillRoundedRect(30, y + 4, GAME_WIDTH - 60, ROW_H - 8, 12);
    g.lineStyle(highlight ? 2 : 1, highlight ? TEAM.P1.main : COLORS.steel, highlight ? 1 : 0.7).strokeRoundedRect(30, y + 4, GAME_WIDTH - 60, ROW_H - 8, 12);
    const cy = y + ROW_H / 2;
    const rank = label(this, 80, cy, `${entry.rank}`, { size: 22, color: '#8fa3bf' });
    const avatar = this.add.image(140, cy, pickTexture(this, entry.avatar, 'avatar_player')).setDisplaySize(52, 52);
    const name = label(this, 180, cy - 12, entry.name.toUpperCase(), { size: 19, align: 'left', color: highlight ? TEAM.P1.css : '#ffffff' });
    const league = label(this, 180, cy + 14, entry.league.toUpperCase(), { size: 13, align: 'left', color: hex(leagueColor(entry.league)) });
    const badge = this.add.image(560, cy, pickTexture(this, `league_${entry.league.toLowerCase()}`, 'icon_trophy'));
    badge.setScale(44 / badge.height);
    const trophies = label(this, GAME_WIDTH - 50, cy, `${entry.trophies}`, { size: 22, align: 'right', color: '#ffd38a' });
    parent.add([g, rank, avatar, name, league, badge, trophies]);
  }

  private list(entries: RankEntry[]): void {
    const area = scrollArea(this, 0, LIST_TOP, GAME_WIDTH, LIST_BOTTOM - LIST_TOP);
    entries.forEach((entry, i) => this.row(area.content, entry, i * ROW_H));
    area.setContentHeight(entries.length * ROW_H + 20);
    const mine = entries.findIndex((e) => e.isPlayer);
    if (mine > 3) area.scrollTo(Math.max(0, (mine - 3) * ROW_H));
  }

  /** Your own rank stays visible no matter where the list is scrolled. */
  private pinnedRow(me: RankEntry): void {
    const c = this.add.container(0, LIST_BOTTOM + 8).setDepth(20);
    const bg = this.add.rectangle(GAME_WIDTH / 2, 46, GAME_WIDTH, 100, 0x05080c, 0.95);
    c.add(bg);
    this.row(c, me, 6);
  }
}
