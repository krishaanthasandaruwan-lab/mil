import Phaser from 'phaser';
import type { PluginListenerHandle } from '@capacitor/core';
import { sfx } from '../audio/sfx';
import { pickTexture } from '../art/assets';
import { canStartMatch } from '../core/economy';
import { loadProfile } from '../core/profile';
import { gcPlayer, showGlobalLeaderboard, signInToGameCenter } from '../platform/gamecenter';
import { FoldNative, isNativeIOS, type GcMatch } from '../platform/native';
import { otherSide } from '../core/types';
import { decodeState, localSideOf, opponentAlias } from '../platform/online';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, hex } from '../theme';
import { confirm, screenBackground, screenHeader, showPaywall } from '../ui/screen';
import { scrollArea, type ScrollArea } from '../ui/scroll';
import { GameButton, label, panel } from '../ui/widgets';

const MATCH_ENDED = 2;

/** Online lobby: Game Center sign-in, new turn-based match, and your active matches. */
export class OnlineScene extends Phaser.Scene {
  private body!: Phaser.GameObjects.Container;
  private list: ScrollArea | undefined;
  private listener: PluginListenerHandle | undefined;

  constructor() {
    super('Online');
  }

  create(): void {
    this.cameras.main.fadeIn(200);
    screenBackground(this);
    screenHeader(this, 'ONLINE', () => this.scene.start('Menu'));
    this.body = this.add.container(0, 0);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => void this.listener?.remove());
    void this.render();
  }

  private async render(): Promise<void> {
    this.body.removeAll(true);
    this.list?.destroy();
    this.list = undefined;

    if (!isNativeIOS()) {
      this.message('Online battles use Apple Game Center.', 'Play online in the Fold Warfare app for iPhone. Battles vs the bot and face-to-face 2-player work here.');
      return;
    }
    let player = gcPlayer();
    if (!player.authenticated) player = await signInToGameCenter();
    if (!player.authenticated) {
      this.message('Sign in to Game Center', 'Online matches, the global leaderboard and achievements use your Game Center account.');
      this.body.add(new GameButton(this, GAME_WIDTH / 2, 640, 'SIGN IN', { width: 320, skin: 'blue', fontSize: 22, onClick: () => void this.render() }));
      return;
    }

    this.body.add(label(this, GAME_WIDTH / 2, 214, `Signed in as ${player.alias ?? 'player'}`, { size: 17, color: '#8fa3bf' }));
    this.body.add(new GameButton(this, GAME_WIDTH / 2, 300, 'NEW ONLINE MATCH', { width: 460, skin: 'fold', fontSize: 26, onClick: () => void this.newMatch() }));
    this.body.add(new GameButton(this, GAME_WIDTH / 2, 404, 'GLOBAL LEADERBOARD', { width: 360, skin: 'gold', fontSize: 18, onClick: () => void showGlobalLeaderboard() }));
    this.body.add(label(this, GAME_WIDTH / 2, 470, 'Each placement is one turn. Game Center tells you when it is your move.', { size: 15, color: '#cfe3ff', wrap: 620 }));
    this.body.add(label(this, 48, 530, 'YOUR MATCHES', { size: 18, align: 'left', color: hex(COLORS.cyan) }));

    if (!this.listener) this.listener = await FoldNative.addListener('turnEvent', () => void this.render());
    try {
      const { matches } = await FoldNative.loadMatches();
      this.showMatches(matches);
    } catch {
      this.body.add(label(this, GAME_WIDTH / 2, 640, 'Could not load matches. Check your connection.', { size: 17, color: '#ff8080' }));
    }
  }

  private message(title: string, text: string): void {
    this.body.add(panel(this, GAME_WIDTH / 2, 470, 640, 320));
    this.body.add(this.add.image(GAME_WIDTH / 2, 380, pickTexture(this, 'icon_trophy')).setDisplaySize(80, 80));
    this.body.add(label(this, GAME_WIDTH / 2, 460, title, { size: 24, color: hex(COLORS.gold), wrap: 560 }));
    this.body.add(label(this, GAME_WIDTH / 2, 530, text, { size: 17, color: '#cfe3ff', wrap: 560 }));
  }

  private showMatches(matches: GcMatch[]): void {
    const sorted = [...matches].sort((a, b) => Number(b.isMyTurn) - Number(a.isMyTurn) || Number(a.status === MATCH_ENDED) - Number(b.status === MATCH_ENDED));
    if (sorted.length === 0) {
      this.body.add(label(this, GAME_WIDTH / 2, 640, 'No matches yet — start one above!', { size: 18, color: '#8fa3bf' }));
      return;
    }
    const area = scrollArea(this, 0, 560, GAME_WIDTH, GAME_HEIGHT - 600);
    this.list = area;
    sorted.forEach((m, i) => {
      const y = i * 92;
      const ended = m.status === MATCH_ENDED;
      const state = decodeState(m.data);
      const me = localSideOf(m);
      const ready = state?.phase === 'ready';
      const status = ended
        ? 'FINISHED'
        : ready && state?.folded?.[me]
          ? 'WAITING FOR THEIR FOLD'
          : ready && state?.folded?.[otherSide(me)]
            ? 'THEY FOLDED: YOUR MOVE'
            : ready
              ? 'READY TO FOLD'
              : m.isMyTurn
                ? 'YOUR TURN'
                : 'THEIR TURN';
      const yourMove = !ended && (ready ? !state?.folded?.[me] : m.isMyTurn);
      const color = ended ? '#8fa3bf' : yourMove ? '#3ddc6b' : '#ffd38a';
      const g = this.add.graphics();
      g.fillStyle(0x000000, 0.6).fillRoundedRect(30, y + 6, GAME_WIDTH - 60, 80, 12);
      g.lineStyle(m.isMyTurn && !ended ? 2 : 1, m.isMyTurn && !ended ? COLORS.green : COLORS.steel, 1).strokeRoundedRect(30, y + 6, GAME_WIDTH - 60, 80, 12);
      const name = label(this, 60, y + 34, `vs ${opponentAlias(m).toUpperCase()}`, { size: 20, align: 'left' });
      const units = state ? `${state.units.length}/16 units placed` : 'New match';
      const sub = label(this, 60, y + 62, units, { size: 14, align: 'left', color: '#8fa3bf' });
      const tag = label(this, GAME_WIDTH - 60, y + 46, status, { size: 17, align: 'right', color });
      const hit = this.add.zone(30, y + 6, GAME_WIDTH - 60, 80).setOrigin(0, 0).setInteractive({ useHandCursor: true });
      hit.on('pointerup', () => this.open(m));
      area.content.add([g, name, sub, tag, hit]);
    });
    area.setContentHeight(sorted.length * 92 + 20);
  }

  private async newMatch(): Promise<void> {
    if (!canStartMatch(loadProfile(), 'online')) {
      showPaywall(this, () => void this.render(), 'online');
      return;
    }
    sfx.click();
    try {
      const res = await FoldNative.findMatch({ inviteMessage: 'Fold Warfare: fold your phone and fight me!' });
      if (!res.match) return;
      this.open(res.match);
    } catch (err) {
      confirm(this, `Game Center could not start a match: ${String(err)}`, 'OK', () => undefined);
    }
  }

  private open(match: GcMatch): void {
    sfx.click();
    this.scene.start('Game', { mode: 'online', online: match, opponent: { name: opponentAlias(match), trophies: 0 }, difficulty: 'veteran', localSide: localSideOf(match) });
  }
}
