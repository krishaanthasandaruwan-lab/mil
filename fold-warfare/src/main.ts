import Phaser from 'phaser';
import { BattleScene } from './scenes/BattleScene';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { ArmoryScene } from './scenes/ArmoryScene';
import { LeaderboardScene } from './scenes/LeaderboardScene';
import { LeaguesScene } from './scenes/LeaguesScene';
import { MenuScene } from './scenes/MenuScene';
import { OnlineScene } from './scenes/OnlineScene';
import { ProfileScene } from './scenes/ProfileScene';
import { SettingsScene } from './scenes/SettingsScene';
import { StoreScene } from './scenes/StoreScene';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from './theme';

const start = async (): Promise<void> => {
  try {
    await Promise.all([document.fonts.load('40px "Russo One"'), document.fonts.load('700 40px "Rajdhani"')]);
  } catch {
    // Offline: fall back to the system font stack.
  }
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: COLORS.bgDeep,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true, preserveDrawingBuffer: true, roundPixels: false },
    scene: [BootScene, MenuScene, GameScene, BattleScene, StoreScene, ArmoryScene, LeaguesScene, LeaderboardScene, ProfileScene, SettingsScene, OnlineScene],
  });
  if (import.meta.env.DEV) (window as unknown as { __game: Phaser.Game }).__game = game;
};

void start();
