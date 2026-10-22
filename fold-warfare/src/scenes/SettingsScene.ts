import Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { clearPhoto } from '../art/avatar';
import policy from '../content/privacy.json';
import { loadProfile, resetProgress, updateProfile } from '../core/profile';
import { restorePurchases } from '../platform/purchases';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, hex } from '../theme';
import { closeModal, confirm, modal, screenBackground, screenHeader } from '../ui/screen';
import { scrollArea } from '../ui/scroll';
import { GameButton, label, toggleSwitch } from '../ui/widgets';

export const APP_VERSION = '1.0.0';

const fillPlaceholders = (text: string): string =>
  text.replace('{developer}', policy.placeholders.developer).replace('{email}', policy.placeholders.email);

/** Sound, music, vibration, privacy policy, purchases and data controls. */
export class SettingsScene extends Phaser.Scene {
  constructor() {
    super('Settings');
  }

  create(): void {
    this.cameras.main.fadeIn(200);
    screenBackground(this);
    screenHeader(this, 'SETTINGS', () => this.scene.start('Menu'));
    const p = loadProfile();

    this.section(240, 'AUDIO & FEEL');
    this.toggleRow(296, 'All sound', !p.muted, (on) => {
      sfx.setMuted(!on);
      updateProfile((x) => {
        x.muted = !on;
      });
    });
    this.toggleRow(376, 'Sound effects', p.effects, (on) => {
      sfx.setEffectsEnabled(on);
      updateProfile((x) => {
        x.effects = on;
      });
    });
    this.toggleRow(456, 'Music', p.music, (on) => {
      updateProfile((x) => {
        x.music = on;
      });
      sfx.setMusicEnabled(on);
    });
    this.toggleRow(536, 'Announcer voice', p.voice, (on) => {
      sfx.setVoiceEnabled(on);
      updateProfile((x) => {
        x.voice = on;
      });
    });
    this.toggleRow(616, 'Vibration', p.vibration, (on) => {
      sfx.vibration = on;
      updateProfile((x) => {
        x.vibration = on;
      });
    });

    this.section(704, 'ACCOUNT & DATA');
    this.linkRow(760, 'Profile & picture', () => this.scene.start('Profile'));
    this.linkRow(840, 'Privacy Policy', () => this.showPrivacy());
    this.linkRow(920, 'Restore purchases', async () => {
      const restored = await restorePurchases();
      const unlocked = loadProfile().unlocked;
      confirm(this, restored || unlocked ? 'Your full game unlock is active.' : 'No previous purchases found for this Apple ID.', 'OK', () => undefined);
    });
    this.linkRow(1000, 'Reset progress', () =>
      confirm(this, 'Erase ALL progress, coins, upgrades and your profile picture? This cannot be undone.', 'ERASE', () => {
        resetProgress();
        clearPhoto();
        this.scene.restart();
      }),
    );

    this.section(1090, 'ABOUT');
    label(this, GAME_WIDTH / 2, 1140, `Fold Warfare · version ${APP_VERSION}`, { size: 18, color: '#cfe3ff' });
    label(this, GAME_WIDTH / 2, 1174, 'Progress is saved on this device. Online play uses Game Center.', { size: 15, color: '#8fa3bf' });
  }

  private section(y: number, title: string): void {
    label(this, 48, y, title, { size: 16, align: 'left', color: hex(COLORS.cyan) });
    this.add.graphics().lineStyle(1, COLORS.cyan, 0.3).lineBetween(48, y + 18, GAME_WIDTH - 48, y + 18);
  }

  private rowBg(y: number): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.55).fillRoundedRect(40, y - 34, GAME_WIDTH - 80, 68, 12);
    g.lineStyle(1, COLORS.steel, 0.8).strokeRoundedRect(40, y - 34, GAME_WIDTH - 80, 68, 12);
    return g;
  }

  private toggleRow(y: number, text: string, value: boolean, onChange: (on: boolean) => void): void {
    this.rowBg(y);
    label(this, 70, y, text, { size: 22, align: 'left' });
    toggleSwitch(this, GAME_WIDTH - 100, y, value, onChange);
  }

  private linkRow(y: number, text: string, onTap: () => void): void {
    const g = this.rowBg(y);
    label(this, 70, y, text, { size: 22, align: 'left' });
    label(this, GAME_WIDTH - 76, y, '>', { size: 26, color: '#8fa3bf' });
    const zone = this.add.zone(40, y - 34, GAME_WIDTH - 80, 68).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => g.setAlpha(0.6));
    zone.on('pointerout', () => g.setAlpha(1));
    zone.on('pointerup', () => {
      g.setAlpha(1);
      sfx.click();
      onTap();
    });
  }

  /** The same policy text that ships as docs/Privacy_Policy.docx and public/privacy.html. */
  private showPrivacy(): void {
    const root = modal(this, 680, 1180);
    const top = GAME_HEIGHT / 2 - 590;
    root.add(label(this, GAME_WIDTH / 2, top + 50, 'PRIVACY POLICY', { size: 28, color: hex(COLORS.gold) }));
    root.add(label(this, GAME_WIDTH / 2, top + 86, `Effective ${policy.effectiveDate}`, { size: 15, color: '#8fa3bf' }));

    const area = scrollArea(this, 70, top + 116, GAME_WIDTH - 140, 900);
    area.zone.setDepth(801);
    let y = 0;
    const add = (text: string, size: number, color: string, gap: number): void => {
      const t = label(this, 0, y, text, { size, align: 'left', color, wrap: GAME_WIDTH - 150 }).setOrigin(0, 0);
      t.setShadow(0, 0, 'transparent', 0);
      area.content.add(t);
      y += t.height + gap;
    };
    add(fillPlaceholders(policy.intro), 17, '#e6edf7', 18);
    policy.sections.forEach((s) => {
      add(s.heading, 19, '#5fb0ff', 8);
      s.paragraphs.forEach((para) => add(fillPlaceholders(para), 17, '#cfe3ff', 12));
      y += 8;
    });
    area.setContentHeight(y + 20);

    root.add(
      new GameButton(this, GAME_WIDTH / 2 - 150, top + 1100, 'OPEN WEB PAGE', {
        width: 270,
        skin: 'blue',
        fontSize: 17,
        onClick: () => window.open('privacy.html', '_blank', 'noopener'),
      }),
    );
    root.add(
      new GameButton(this, GAME_WIDTH / 2 + 150, top + 1100, 'CLOSE', {
        width: 270,
        skin: 'green',
        fontSize: 17,
        onClick: () => {
          area.destroy();
          closeModal(this, root);
        },
      }),
    );
  }
}
