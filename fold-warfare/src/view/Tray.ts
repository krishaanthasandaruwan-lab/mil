import Phaser from 'phaser';
import { pickTexture } from '../art/assets';
import { UNITS } from '../core/balance';
import type { PlayerState } from '../core/match';
import type { Side, SkillType, UnitType } from '../core/types';
import { COLORS, GAME_WIDTH, TEAM, hex } from '../theme';
import { label } from '../ui/widgets';

export const UNIT_ORDER: UnitType[] = ['tank', 'mortar', 'bomb', 'rocket'];
export const SKILL_ORDER: SkillType[] = ['hide', 'boost', 'radar', 'shield', 'foldpreview'];

const CARD_X = [-290, -172, -54, 64];
const CARD_W = 104;
const CARD_H = 136;
const SKILL_SIZE = 62;
const SKILL_POS: Record<SkillType, { x: number; y: number }> = {
  hide: { x: 188, y: -34 },
  boost: { x: 256, y: -34 },
  radar: { x: 324, y: -34 },
  shield: { x: 222, y: 40 },
  foldpreview: { x: 290, y: 40 },
};

const ART: Record<UnitType, string> = { tank: 'tank', mortar: 'trooper', bomb: 'mine', rocket: 'rocket' };
const LEGACY: Record<UnitType, string> = { tank: 'tank_body', mortar: 'mortar', bomb: 'bomb', rocket: 'rocket_body' };

export const unitArt = (scene: Phaser.Scene, type: UnitType, side: Side): string => {
  const team = TEAM[side].art;
  const key = type === 'bomb' ? `mine_${team}_idle` : `${ART[type]}_${team}_idle_ne`;
  return pickTexture(scene, key, `${LEGACY[type]}_${side}`);
};

export type TrayState = {
  player: PlayerState;
  selected: UnitType | undefined;
  radarMode: boolean;
  bunkerPhase: boolean;
  active: boolean;
};

type Card = { container: Phaser.GameObjects.Container; frame: Phaser.GameObjects.Image; icon: Phaser.GameObjects.Image; count: Phaser.GameObjects.Text };
type SkillButton = { container: Phaser.GameObjects.Container; glow: Phaser.GameObjects.Graphics; count: Phaser.GameObjects.Text };

/**
 * One player's army tray: 4 unit cards + 5 skills. Laid out around its own centre so it can sit at the
 * bottom edge, or rotated 180° at the top edge for the second player in face-to-face mode.
 */
export class Tray extends Phaser.GameObjects.Container {
  readonly side: Side;
  private readonly cards = new Map<UnitType, Card>();
  private readonly skills = new Map<SkillType, SkillButton>();
  private readonly title: Phaser.GameObjects.Text;
  private readonly dim: Phaser.GameObjects.Rectangle;

  constructor(
    scene: Phaser.Scene,
    y: number,
    height: number,
    side: Side,
    flipped: boolean,
    handlers: { onCard: (type: UnitType, p: Phaser.Input.Pointer) => void; onSkill: (skill: SkillType) => void },
  ) {
    super(scene, GAME_WIDTH / 2, y);
    this.side = side;
    const g = scene.add.graphics();
    g.fillGradientStyle(0x0c131c, 0x0c131c, 0x05080c, 0x05080c, 1);
    g.fillRect(-GAME_WIDTH / 2, -height / 2, GAME_WIDTH, height);
    g.lineStyle(2, TEAM[side].main, 0.6).lineBetween(-GAME_WIDTH / 2, -height / 2, GAME_WIDTH / 2, -height / 2);
    this.add(g);
    this.title = label(scene, -GAME_WIDTH / 2 + 16, -height / 2 + 16, '', { size: 14, align: 'left', color: hex(COLORS.cyan) });
    this.add(this.title);

    UNIT_ORDER.forEach((type, i) => {
      const c = scene.add.container(CARD_X[i] ?? 0, 10);
      const frame = scene.add.image(0, 0, pickTexture(scene, 'ui_card_blue', 'fx_soft')).setDisplaySize(CARD_W, CARD_H);
      const icon = scene.add.image(0, -6, unitArt(scene, type, side));
      const name = label(scene, 0, CARD_H / 2 - 18, UNITS[type].name.toUpperCase(), { size: 13 });
      const count = label(scene, CARD_W / 2 - 18, -CARD_H / 2 + 14, '', { size: 16, color: hex(COLORS.gold) });
      c.add([frame, icon, name, count]);
      c.setSize(CARD_W, CARD_H).setInteractive({ useHandCursor: true });
      c.on('pointerdown', (p: Phaser.Input.Pointer) => handlers.onCard(type, p));
      this.add(c);
      this.cards.set(type, { container: c, frame, icon, count });
    });

    SKILL_ORDER.forEach((skill) => {
      const { x, y: sy } = SKILL_POS[skill];
      const c = scene.add.container(x, sy);
      const glow = scene.add.graphics();
      const frame = scene.add.image(0, 0, pickTexture(scene, 'ui_skill_frame', 'fx_soft')).setDisplaySize(SKILL_SIZE, SKILL_SIZE);
      const icon = scene.add.image(0, 0, pickTexture(scene, `icon_skill_${skill}`, `icon_${skill}`, 'fx_question')).setDisplaySize(SKILL_SIZE * 0.58, SKILL_SIZE * 0.58);
      const count = label(scene, SKILL_SIZE * 0.38, -SKILL_SIZE * 0.38, '', { size: 14, color: hex(COLORS.gold) });
      c.add([glow, frame, icon, count]);
      c.setSize(SKILL_SIZE, SKILL_SIZE).setInteractive({ useHandCursor: true });
      c.on('pointerup', () => handlers.onSkill(skill));
      this.add(c);
      this.skills.set(skill, { container: c, glow, count });
    });

    this.dim = scene.add.rectangle(0, 0, GAME_WIDTH, height, 0x000000, 0.55).setVisible(false);
    this.add(this.dim);
    if (flipped) this.setAngle(180);
    scene.add.existing(this);
  }

  refresh(state: TrayState): void {
    const { player, selected, radarMode, bunkerPhase, active } = state;
    const left = Object.values(player.remaining).reduce((a, b) => a + b, 0);
    this.title.setText(
      !active ? 'WAITING FOR OPPONENT…' : bunkerPhase ? 'PRESS & DRAG ON YOUR SECTOR TO PLACE YOUR BUNKER' : `YOUR ARMY · ${left} LEFT`,
    );
    this.dim.setVisible(!active);
    UNIT_ORDER.forEach((type) => {
      const card = this.cards.get(type);
      if (!card) return;
      const count = player.remaining[type];
      const isSelected = selected === type && !bunkerPhase && active;
      card.icon.setTexture(unitArt(this.scene, type, this.side));
      card.icon.setScale(Math.min(80 / card.icon.width, 68 / card.icon.height));
      card.count.setText(`x${count}`);
      card.container.setAlpha(count > 0 ? 1 : 0.3);
      card.frame.setTexture(pickTexture(this.scene, isSelected ? 'ui_card_gold' : 'ui_card_blue', 'fx_soft')).setDisplaySize(CARD_W, CARD_H);
      this.scene.tweens.add({ targets: card.container, y: isSelected ? 2 : 10, duration: 120, ease: 'Back.Out' });
    });
    SKILL_ORDER.forEach((skill) => {
      const btn = this.skills.get(skill);
      if (!btn) return;
      const count = player.skillsLeft[skill];
      const armed = (skill === 'hide' && player.armed.hide) || (skill === 'boost' && player.armed.boost) || (skill === 'radar' && radarMode);
      btn.count.setText(count > 0 ? `${count}` : '');
      btn.container.setAlpha(count > 0 || armed ? 1 : 0.3);
      btn.glow.clear();
      if (armed) btn.glow.fillStyle(COLORS.gold, 0.35).fillCircle(0, 0, SKILL_SIZE * 0.58);
    });
  }
}
