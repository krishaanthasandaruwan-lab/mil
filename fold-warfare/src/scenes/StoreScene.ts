import Phaser from 'phaser';
import { haptic, sfx } from '../audio/sfx';
import { pickTexture } from '../art/assets';
import { SKILL_INFO } from '../core/balance';
import {
  CHEST_GEM_COST,
  COIN_PACKS,
  FULL_UNLOCK,
  GEM_PACKS,
  SKILL_OFFERS,
  buySkill,
  isChestReward,
  openChest,
  type ChestReward,
  type MoneyPack,
} from '../core/economy';
import { loadProfile, updateProfile } from '../core/profile';
import { UNLOCK_PRODUCT, buyProduct, isTestStore, packProductId, priceOf } from '../platform/purchases';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, hex } from '../theme';
import { closeModal, confirm, modal, rewardFly, screenBackground, screenHeader, showPaywall, testModeNote, type CurrencyBar } from '../ui/screen';
import { GameButton, label, panel } from '../ui/widgets';
import { playSheet, sparks } from '../view/fx';

type Tab = 'coins' | 'gems' | 'skills' | 'chests';
const TABS: { id: Tab; title: string }[] = [
  { id: 'coins', title: 'COINS' },
  { id: 'gems', title: 'GEMS' },
  { id: 'skills', title: 'SKILLS' },
  { id: 'chests', title: 'CHESTS' },
];

export class StoreScene extends Phaser.Scene {
  private tab: Tab = 'coins';
  private content!: Phaser.GameObjects.Container;
  private tabButtons = new Map<Tab, Phaser.GameObjects.Container>();
  private bar!: CurrencyBar;

  constructor() {
    super('Store');
  }

  init(data: { tab?: Tab }): void {
    this.tab = data.tab ?? 'coins';
    this.tabButtons = new Map();
  }

  create(): void {
    this.cameras.main.fadeIn(200);
    screenBackground(this);
    this.bar = screenHeader(this, 'STORE', () => this.scene.start('Menu'));
    this.buildTabs();
    this.content = this.add.container(0, 0);
    testModeNote(this);
    this.showTab(this.tab);
  }

  private buildTabs(): void {
    const w = 160;
    TABS.forEach((t, i) => {
      const x = GAME_WIDTH / 2 + (i - 1.5) * (w + 8);
      const c = this.add.container(x, 228);
      const bg = this.add.graphics().setName('bg');
      const txt = label(this, 0, 0, t.title, { size: 20 });
      c.add([bg, txt]);
      c.setSize(w, 52).setInteractive({ useHandCursor: true });
      c.on('pointerup', () => {
        sfx.click();
        this.showTab(t.id);
      });
      this.tabButtons.set(t.id, c);
    });
  }

  private showTab(tab: Tab): void {
    this.tab = tab;
    this.tabButtons.forEach((c, id) => {
      const bg = c.getByName('bg') as Phaser.GameObjects.Graphics;
      bg.clear();
      const active = id === tab;
      bg.fillStyle(active ? COLORS.blueUi : 0x000000, active ? 0.9 : 0.6).fillRoundedRect(-80, -26, 160, 52, 14);
      bg.lineStyle(2, active ? COLORS.cyan : COLORS.steel, 1).strokeRoundedRect(-80, -26, 160, 52, 14);
    });
    this.content.removeAll(true);
    if (tab === 'coins' || tab === 'gems') this.buildPacks(tab === 'coins' ? COIN_PACKS : GEM_PACKS);
    if (tab === 'skills') this.buildSkills();
    if (tab === 'chests') this.buildChests();
    this.content.setAlpha(0).setY(20);
    this.tweens.add({ targets: this.content, alpha: 1, y: 0, duration: 200, ease: 'Cubic.Out' });
  }

  private card(y: number, h: number): void {
    this.content.add(panel(this, GAME_WIDTH / 2, y, 660, h));
  }

  private buildPacks(packs: MoneyPack[]): void {
    packs.forEach((pack, i) => {
      const y = 400 + i * 290;
      this.card(y, 270);
      const img = this.add.image(170, y, pickTexture(this, pack.image, 'icon_coin'));
      img.setScale(Math.min(210 / img.width, 210 / img.height));
      this.tweens.add({ targets: img, scale: img.scale * 1.05, duration: 1200 + i * 200, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      this.content.add(img);
      this.content.add(label(this, 300, y - 60, pack.title.toUpperCase(), { size: 26, align: 'left' }));
      const amount = pack.coins || pack.gems;
      const icon = this.add.image(318, y, pickTexture(this, pack.coins ? 'icon_coin' : 'icon_gem')).setDisplaySize(44, 44);
      this.content.add([icon, label(this, 350, y, `${amount.toLocaleString()}`, { size: 36, align: 'left', color: hex(COLORS.gold) })]);
      if (pack.tag) {
        const tag = label(this, 600, y - 100, pack.tag, { size: 16, color: '#000000', stroke: 0 });
        const bg = this.add.rectangle(600, y - 100, tag.width + 24, 30, COLORS.gold).setStrokeStyle(2, 0x000000);
        this.content.add([bg, tag]);
      }
      this.content.add(
        new GameButton(this, 520, y + 72, priceOf(packProductId(pack), pack.price), {
          width: 220,
          skin: 'green',
          fontSize: 26,
          onClick: () => {
            const purchase = async (): Promise<void> => {
              const outcome = await buyProduct(packProductId(pack));
              if (outcome === 'granted') this.celebrate(new Phaser.Math.Vector2(img.x, img.y), pack.coins ? 'coin' : 'gem', amount);
              if (outcome === 'pending') confirm(this, 'Your purchase is waiting for approval.', 'OK', () => undefined);
              if (outcome === 'failed') confirm(this, 'The App Store could not complete the purchase.', 'OK', () => undefined);
            };
            // In the iOS app Apple's own payment sheet is the confirmation; the browser build asks first.
            if (isTestStore()) confirm(this, `Buy ${pack.title} for ${pack.price}?`, 'BUY', () => void purchase());
            else void purchase();
          },
        }),
      );
    });
  }

  private buildSkills(): void {
    const profile = loadProfile();
    SKILL_OFFERS.forEach((offer, i) => {
      const y = 340 + i * 172;
      this.card(y, 158);
      const icon = this.add.image(110, y, pickTexture(this, `icon_skill_${offer.skill}`, 'fx_question')).setDisplaySize(96, 96);
      const info = SKILL_INFO[offer.skill];
      this.content.add(icon);
      this.content.add(label(this, 180, y - 44, info.name.toUpperCase(), { size: 24, align: 'left', color: hex(COLORS.cyan) }));
      this.content.add(label(this, 180, y + 2, info.blurb, { size: 17, align: 'left', wrap: 300, color: '#cfe3ff' }));
      this.content.add(label(this, 180, y + 50, `OWNED: ${profile.skills[offer.skill]}`, { size: 16, align: 'left', color: '#ffd38a' }));
      this.content.add(
        new GameButton(this, 580, y, `x${offer.count} · ${offer.coins}`, {
          width: 200,
          skin: 'gold',
          fontSize: 20,
          icon: pickTexture(this, 'icon_coin'),
          onClick: () => {
            const profile = loadProfile();
            const result = buySkill(profile, offer);
            if (!result.ok) {
              sfx.invalid();
              this.notEnough('coins');
              return;
            }
            updateProfile((p) => Object.assign(p, profile));
            sfx.select();
            haptic(15);
            sparks(this, this.content, icon.x, icon.y, COLORS.cyan, 16);
            this.bar.refresh();
            this.showTab('skills');
          },
        }),
      );
    });
  }

  private buildChests(): void {
    const profile = loadProfile();
    const y = 520;
    this.card(y, 560);
    const chest = this.add.image(GAME_WIDTH / 2, y - 90, pickTexture(this, 'store_chest_closed', 'store_chest_open'));
    chest.setScale(300 / chest.height);
    this.tweens.add({ targets: chest, angle: { from: -2, to: 2 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    this.content.add(chest);
    this.content.add(label(this, GAME_WIDTH / 2, y + 100, 'SUPPLY CHEST', { size: 32, color: hex(COLORS.gold) }));
    this.content.add(label(this, GAME_WIDTH / 2, y + 148, '200–600 coins · 2 random skills · chance of gems', { size: 18, color: '#cfe3ff' }));
    this.content.add(
      new GameButton(this, GAME_WIDTH / 2, y + 220, `OPEN · ${CHEST_GEM_COST}`, {
        width: 340,
        skin: 'fold',
        fontSize: 26,
        icon: pickTexture(this, 'icon_gem'),
        onClick: () => {
          const profile = loadProfile();
          const result = openChest(profile, Math.random);
          if (isChestReward(result)) updateProfile((p) => Object.assign(p, profile));
          if (!isChestReward(result)) {
            sfx.invalid();
            this.notEnough('gems');
            return;
          }
          this.openChestAnimation(result);
        },
      }),
    );
    if (!profile.unlocked) {
      const uy = 1000;
      this.card(uy, 220);
      const badge = this.add.image(150, uy, pickTexture(this, 'store_full_unlock', 'icon_star'));
      badge.setScale(170 / badge.height);
      this.content.add(badge);
      this.content.add(label(this, 260, uy - 50, 'FULL GAME', { size: 28, align: 'left', color: hex(COLORS.gold) }));
      this.content.add(label(this, 260, uy - 6, `Unlimited battles · online play · +${FULL_UNLOCK.coins} coins · +${FULL_UNLOCK.gems} gems`, { size: 17, align: 'left', wrap: 400, color: '#cfe3ff' }));
      this.content.add(
        new GameButton(this, 520, uy + 60, priceOf(UNLOCK_PRODUCT, FULL_UNLOCK.price), {
          width: 220,
          skin: 'green',
          fontSize: 26,
          onClick: () =>
            showPaywall(this, () => {
              this.bar.refresh();
              this.showTab('chests');
            }),
        }),
      );
    }
  }

  private openChestAnimation(reward: ChestReward): void {
    const root = modal(this, 640, 900);
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2 - 160;
    const chest = this.add.image(cx, cy, pickTexture(this, 'store_chest_closed', 'store_chest_open'));
    chest.setScale(340 / chest.height);
    root.add(chest);
    const shakes = 3;
    for (let i = 0; i < shakes; i++) {
      this.time.delayedCall(250 + i * 380, () => {
        sfx.clang();
        haptic(20);
        this.tweens.add({ targets: chest, angle: { from: -8, to: 8 }, duration: 70, yoyo: true, repeat: 1 });
        this.tweens.add({ targets: chest, scale: chest.scale * 1.06, duration: 90, yoyo: true });
      });
    }
    this.time.delayedCall(250 + shakes * 380, () => {
      chest.setTexture(pickTexture(this, 'store_chest_open', 'store_chest_closed'));
      chest.setScale(360 / chest.height);
      sfx.victory();
      haptic([30, 30, 60]);
      this.cameras.main.flash(150, 255, 230, 160);
      playSheet(this, root, 'fx_shockwave_sheet', cx, cy + 60, { size: 600, frameRate: 24, add: true });
      sparks(this, root, cx, cy - 40, COLORS.gold, 40);
      const lines: { icon: string; text: string }[] = [{ icon: 'icon_coin', text: `+${reward.coins} coins` }];
      if (reward.gems) lines.push({ icon: 'icon_gem', text: `+${reward.gems} gems` });
      Object.entries(reward.skills).forEach(([skill, n]) => lines.push({ icon: `icon_skill_${skill}`, text: `+${n} ${SKILL_INFO[skill as keyof typeof SKILL_INFO].name}` }));
      lines.forEach((l, i) => {
        const y = cy + 230 + i * 62;
        const img = this.add.image(cx - 150, y, pickTexture(this, l.icon, 'fx_question')).setDisplaySize(50, 50);
        const t = label(this, cx - 110, y, l.text, { size: 28, align: 'left', color: hex(COLORS.gold) });
        [img, t].forEach((o) => o.setAlpha(0).setX(o.x + 40));
        root.add([img, t]);
        this.tweens.add({ targets: [img, t], alpha: 1, x: '-=40', delay: 200 + i * 180, duration: 260, ease: 'Back.Out', onStart: () => sfx.star(i) });
      });
      root.add(
        new GameButton(this, cx, cy + 600, 'COLLECT', {
          width: 320,
          skin: 'green',
          fontSize: 26,
          onClick: () => {
            closeModal(this, root);
            rewardFly(this, new Phaser.Math.Vector2(cx, cy), this.bar.coinTarget, 'coin', 10, () => this.bar.refresh());
            this.showTab('chests');
          },
        }),
      );
    });
  }

  private celebrate(from: Phaser.Math.Vector2, kind: 'coin' | 'gem', amount: number): void {
    sfx.victory();
    haptic([20, 20, 40]);
    rewardFly(this, from, kind === 'coin' ? this.bar.coinTarget : this.bar.gemTarget, kind, Math.round(amount / 100), () => this.bar.refresh());
  }

  private notEnough(what: 'coins' | 'gems'): void {
    confirm(this, `Not enough ${what}! Get more in the store?`, 'GET MORE', () => this.showTab(what));
  }
}
