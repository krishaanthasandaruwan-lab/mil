import Phaser from 'phaser';
import { loadManifestAssets, preloadManifest } from '../art/assets';
import { loadPhotoTexture } from '../art/avatar';
import { StatusBar } from '@capacitor/status-bar';
import { signInToGameCenter, submitTrophies } from '../platform/gamecenter';
import { connectNativeHinge } from '../platform/fold';
import { isNativeIOS } from '../platform/native';
import { initPurchases } from '../platform/purchases';
import { generateTextures } from '../art/textures';
import { sfx } from '../audio/sfx';
import { loadProfile } from '../core/profile';
import { previewShot, startPreview } from '../preview';
import { COLORS, FONT, GAME_HEIGHT, GAME_WIDTH } from '../theme';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    preloadManifest(this);
  }

  async create(): Promise<void> {
    const bar = this.add.rectangle(GAME_WIDTH / 2 - 200, GAME_HEIGHT / 2 + 40, 0, 8, COLORS.cyan).setOrigin(0, 0.5);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, 404, 12).setStrokeStyle(2, COLORS.cyan, 0.5);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10, 'DEPLOYING...', { fontFamily: FONT, fontSize: '28px', color: '#5ff3ff' }).setOrigin(0.5);
    this.load.on(Phaser.Loader.Events.PROGRESS, (v: number) => bar.setSize(400 * v, 8));
    await loadManifestAssets(this);
    generateTextures(this);
    await loadPhotoTexture(this);
    const profile = loadProfile();
    sfx.setMuted(profile.muted);
    sfx.vibration = profile.vibration;
    sfx.musicEnabled = profile.music;
    sfx.setEffectsEnabled(profile.effects);
    sfx.setVoiceEnabled(profile.voice);
    void sfx.loadSamples();
    if (isNativeIOS()) {
      void StatusBar.hide().catch(() => undefined);
      void signInToGameCenter().then(async (gc) => {
        if (gc.authenticated) await submitTrophies(loadProfile().trophies);
      });
      void initPurchases(() => undefined);
      void connectNativeHinge();
    }
    this.input.once('pointerdown', () => sfx.unlock());
    const shot = previewShot();
    if (shot) {
      startPreview(this, shot);
      return;
    }
    this.scene.start('Menu');
  }
}
