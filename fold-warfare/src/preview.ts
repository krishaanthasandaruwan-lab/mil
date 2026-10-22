import type Phaser from 'phaser';
import { chooseBunkerPos, takeBotTurn } from './core/ai';
import { today } from './core/economy';
import { DEFAULT_LOADOUT, Match } from './core/match';
import { updateProfile } from './core/profile';
import type { Bunker, PlacedUnit, Side, UnitType } from './core/types';
import type { BattleSceneData } from './scenes/BattleScene';
import type { GameSceneData } from './scenes/GameScene';

/**
 * Dev-only: `?shot=placement` etc. jumps straight to a staged screen so every screen can be
 * screenshotted and reviewed without playing a whole match.
 */

export type PreviewShot =
  | 'menu'
  | 'howto'
  | 'bunker'
  | 'placement'
  | 'duel'
  | 'fold'
  | 'battle'
  | 'result'
  | 'store'
  | 'skills'
  | 'chests'
  | 'armory'
  | 'leagues'
  | 'paywall'
  | 'profile'
  | 'settings'
  | 'privacy'
  | 'leaderboard'
  | 'folded'
  | 'minefire'
  | 'minewarn';

const SHOTS: readonly PreviewShot[] = ['menu', 'howto', 'bunker', 'placement', 'duel', 'fold', 'battle', 'result', 'store', 'skills', 'chests', 'armory', 'leagues', 'paywall', 'profile', 'settings', 'privacy', 'leaderboard', 'folded', 'minefire', 'minewarn'];

export const previewShot = (): PreviewShot | undefined => {
  if (!import.meta.env.DEV) return undefined;
  const value = new URLSearchParams(window.location.search).get('shot');
  return SHOTS.find((s) => s === value);
};

const previewSeed = (): number => Number(new URLSearchParams(window.location.search).get('seed') ?? 7);

export const seededRng = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

const OPPONENT = { name: 'General Viper', trophies: 420 };

/** Plays bots for both sides until P1 has `p1Units` down and it's P1's turn again. */
export const stagedMatch = (p1Units: number, seed: number, mode: 'bot' | 'local' = 'bot'): Match => {
  const rng = seededRng(seed);
  const match = new Match(mode, { P1: DEFAULT_LOADOUT, P2: DEFAULT_LOADOUT }, 'P1');
  match.placeBunker('P1', chooseBunkerPos(rng));
  match.placeBunker('P2', chooseBunkerPos(rng));
  while (match.phase === 'units' && !(match.turn === 'P1' && match.ownUnits('P1').length >= p1Units)) {
    takeBotTurn(match, match.turn, 'veteran', rng);
  }
  return match;
};

export const startPreview = (scene: Phaser.Scene, shot: PreviewShot): void => {
  const seed = previewSeed();
  const gameData = (extra: Partial<GameSceneData> = {}): GameSceneData => ({
    mode: 'bot',
    opponent: OPPONENT,
    difficulty: 'veteran',
    ...extra,
  });
  const battleData = (skipToResult: boolean): BattleSceneData => {
    const match = stagedMatch(99, seed);
    return { setup: match.battleSetup(), mode: 'bot', opponent: OPPONENT, difficulty: 'veteran', skipToResult };
  };

  switch (shot) {
    case 'menu':
      scene.scene.start('Menu');
      return;
    case 'howto':
      scene.scene.start('Menu', { showHowTo: true });
      return;
    case 'bunker':
      scene.scene.start('Game', gameData());
      return;
    case 'placement':
      scene.scene.start('Game', gameData({ staged: stagedMatch(5, seed), hover: { x: 330, y: 150 } }));
      return;
    case 'duel':
      scene.scene.start('Game', gameData({ mode: 'local', opponent: { name: 'Player 2', trophies: 0 }, staged: stagedMatch(4, seed, 'local') }));
      return;
    case 'fold':
    case 'battle':
      scene.scene.start('Battle', battleData(false));
      return;
    case 'result':
      scene.scene.start('Battle', battleData(true));
      return;
    case 'minewarn': {
      const staged = stagedMatch(2, seed);
      const bunker = staged.players.P1.bunker?.pos ?? { x: 320, y: 220 };
      const hover = { x: bunker.x + (bunker.x > 320 ? -62 : 62), y: bunker.y };
      scene.scene.start('Game', gameData({ staged, hover, hoverKind: 'bomb' }));
      return;
    }
    case 'folded':
      scene.scene.start('Battle', { ...battleData(false), physicalFold: true });
      return;
    case 'minefire': {
      // Two mines packed next to their own bunker: an enemy tank lands on one and the chain hits the bunker.
      const unit = (side: Side, type: UnitType, x: number, y: number): PlacedUnit => ({ id: `${side}-${type}-${x}`, side, type, pos: { x, y }, level: 1, hidden: false, boosted: false });
      const setup = {
        units: [unit('P1', 'bomb', 380, 330), unit('P1', 'bomb', 440, 335), unit('P1', 'tank', 250, 300), unit('P2', 'tank', 384, 333), unit('P2', 'mortar', 300, 120)],
        bunkers: { P1: { side: 'P1', pos: { x: 320, y: 330 }, level: 1, shielded: false }, P2: { side: 'P2', pos: { x: 320, y: 110 }, level: 1, shielded: false } } as Record<Side, Bunker>,
      };
      scene.scene.start('Battle', { setup, mode: 'bot', opponent: OPPONENT, difficulty: 'veteran' } satisfies BattleSceneData);
      return;
    }
    case 'store':
      scene.scene.start('Store', { tab: 'coins' });
      return;
    case 'skills':
      scene.scene.start('Store', { tab: 'skills' });
      return;
    case 'chests':
      updateProfile((p) => {
        p.gems = Math.max(p.gems, 120);
      });
      scene.scene.start('Store', { tab: 'chests' });
      return;
    case 'armory':
      updateProfile((p) => {
        p.coins = Math.max(p.coins, 900);
        p.levels.tank = Math.max(p.levels.tank, 3);
        p.levels.mortar = Math.max(p.levels.mortar, 2);
      });
      scene.scene.start('Armory');
      return;
    case 'leagues':
      updateProfile((p) => {
        p.trophies = Math.max(p.trophies, 960);
      });
      scene.scene.start('Leagues');
      return;
    case 'profile':
      updateProfile((p) => {
        p.name = 'Krishan';
        p.trophies = Math.max(p.trophies, 640);
        p.matches = Math.max(p.matches, 24);
        p.wins = Math.max(p.wins, 15);
        p.losses = Math.max(p.losses, 9);
        p.bestTrophies = Math.max(p.bestTrophies, 700);
        p.threeStarWins = Math.max(p.threeStarWins, 4);
      });
      scene.scene.start('Profile');
      return;
    case 'settings':
    case 'privacy':
      scene.scene.start('Settings');
      return;
    case 'leaderboard':
      updateProfile((p) => {
        p.trophies = Math.max(p.trophies, 640);
      });
      scene.scene.start('Leaderboard');
      return;
    case 'paywall':
      updateProfile((p) => {
        p.daily = { date: today(), bot: 3, local: 2 };
        p.unlocked = false;
      });
      scene.scene.start('Menu');
      return;
  }
};
