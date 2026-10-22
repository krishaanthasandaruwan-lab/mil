import Phaser from 'phaser';
import type { Side } from '../core/types';
import { GAME_WIDTH, LAYOUT, TEAM, hex } from '../theme';

/**
 * All art is drawn procedurally on canvases at boot, so the game ships with zero image files
 * and every unit gets team-coloured variants for free.
 */

type Ctx = CanvasRenderingContext2D;

const OUTLINE = '#15140f';
const SKIN = '#f2c39b';
const OLIVE = '#56693a';
const STEEL = '#4a4f55';

/** Generated art loaded from the manifest always wins; procedural textures only fill the gaps. */
const make = (scene: Phaser.Scene, key: string, w: number, h: number, draw: (ctx: Ctx) => void): void => {
  if (scene.textures.exists(key)) return;
  const texture = scene.textures.createCanvas(key, w, h);
  if (!texture) throw new Error(`Could not create canvas texture ${key}`);
  const ctx = texture.getContext();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  draw(ctx);
  texture.refresh();
};

const roundRect = (ctx: Ctx, x: number, y: number, w: number, h: number, r: number): void => {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
};

const fillStroke = (ctx: Ctx, fill: string | CanvasGradient, lineWidth = 5): void => {
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
};

const circle = (ctx: Ctx, x: number, y: number, r: number): void => {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
};

const vGradient = (ctx: Ctx, y0: number, y1: number, top: string, bottom: string): CanvasGradient => {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  return g;
};

const radial = (ctx: Ctx, x: number, y: number, r: number, stops: [number, string][]): CanvasGradient => {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  stops.forEach(([at, color]) => g.addColorStop(at, color));
  return g;
};

// ---------- Units ----------

const drawTankBody = (ctx: Ctx, team: (typeof TEAM)[Side]): void => {
  [22, 84].forEach((x) => {
    roundRect(ctx, x, 16, 22, 96, 8);
    fillStroke(ctx, '#3b3b3b');
    ctx.strokeStyle = '#5c5c5c';
    ctx.lineWidth = 3;
    for (let y = 24; y < 108; y += 10) {
      ctx.beginPath();
      ctx.moveTo(x + 4, y);
      ctx.lineTo(x + 18, y);
      ctx.stroke();
    }
  });
  roundRect(ctx, 34, 24, 60, 82, 12);
  fillStroke(ctx, vGradient(ctx, 24, 106, hex(team.light), hex(team.main)));
  ctx.fillStyle = hex(team.dark);
  [92, 98].forEach((y) => ctx.fillRect(46, y, 36, 3));
  ctx.fillStyle = '#ffe9a8';
  circle(ctx, 42, 32, 4);
  ctx.fill();
  circle(ctx, 86, 32, 4);
  ctx.fill();
};

const drawTankTurret = (ctx: Ctx, team: (typeof TEAM)[Side]): void => {
  roundRect(ctx, 58, 8, 12, 50, 4);
  fillStroke(ctx, STEEL, 4);
  roundRect(ctx, 54, 4, 20, 12, 4);
  fillStroke(ctx, '#33373b', 4);
  circle(ctx, 64, 64, 24);
  fillStroke(ctx, radial(ctx, 56, 56, 30, [[0, hex(team.light)], [1, hex(team.main)]]));
  circle(ctx, 70, 70, 7);
  fillStroke(ctx, hex(team.dark), 3);
};

const drawSoldier = (ctx: Ctx, team: (typeof TEAM)[Side]): void => {
  // Mortar tube on a bipod, angled up behind the soldier's right shoulder.
  ctx.lineWidth = 4;
  ctx.strokeStyle = OUTLINE;
  ctx.beginPath();
  ctx.moveTo(98, 70);
  ctx.lineTo(90, 108);
  ctx.moveTo(98, 70);
  ctx.lineTo(112, 106);
  ctx.stroke();
  ctx.save();
  ctx.translate(98, 92);
  ctx.rotate(0.38);
  roundRect(ctx, -8, -66, 16, 72, 5);
  fillStroke(ctx, STEEL, 4);
  roundRect(ctx, -11, -70, 22, 10, 4);
  fillStroke(ctx, '#2e3236', 4);
  ctx.restore();
  ctx.fillStyle = '#2e3236';
  roundRect(ctx, 82, 104, 30, 10, 4);
  fillStroke(ctx, '#2e3236', 4);

  [48, 66].forEach((x) => {
    roundRect(ctx, x, 94, 14, 18, 5);
    fillStroke(ctx, '#2b2b2b', 4);
  });
  roundRect(ctx, 38, 62, 52, 40, 14);
  fillStroke(ctx, vGradient(ctx, 62, 102, hex(team.light), hex(team.main)));
  ctx.fillStyle = '#3d2b1f';
  ctx.fillRect(40, 86, 48, 6);
  ctx.fillStyle = '#c9a227';
  ctx.fillRect(60, 85, 8, 8);
  [38, 90].forEach((x) => {
    circle(ctx, x, 82, 8);
    fillStroke(ctx, SKIN, 4);
  });

  circle(ctx, 64, 46, 24);
  fillStroke(ctx, SKIN);
  ctx.fillStyle = OUTLINE;
  circle(ctx, 56, 52, 3.5);
  ctx.fill();
  circle(ctx, 72, 52, 3.5);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(51, 44);
  ctx.lineTo(60, 47);
  ctx.moveTo(77, 44);
  ctx.lineTo(68, 47);
  ctx.moveTo(59, 62);
  ctx.quadraticCurveTo(64, 59, 69, 62);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(64, 42, 28, Math.PI * 1.02, Math.PI * 1.98);
  ctx.closePath();
  fillStroke(ctx, vGradient(ctx, 14, 42, '#7a8f52', OLIVE));
  ctx.fillStyle = hex(team.main);
  ctx.fillRect(38, 33, 52, 6);
  ctx.lineWidth = 3;
  ctx.strokeStyle = OUTLINE;
  ctx.strokeRect(38, 33, 52, 6);
  roundRect(ctx, 32, 38, 64, 8, 4);
  fillStroke(ctx, OLIVE, 4);
};

const drawMine = (ctx: Ctx, team: (typeof TEAM)[Side]): void => {
  circle(ctx, 64, 64, 36);
  ctx.lineWidth = 5;
  ctx.strokeStyle = hex(team.main);
  ctx.stroke();
  circle(ctx, 64, 64, 30);
  fillStroke(ctx, radial(ctx, 56, 54, 40, [[0, '#9a9a9a'], [1, '#4a4a4a']]));
  circle(ctx, 64, 64, 19);
  fillStroke(ctx, radial(ctx, 60, 58, 22, [[0, '#6e6e6e'], [1, '#3a3a3a']]), 4);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ctx.fillStyle = '#2a2a2a';
    circle(ctx, 64 + Math.cos(a) * 25, 64 + Math.sin(a) * 25, 2.5);
    ctx.fill();
  }
  ctx.fillStyle = '#ffd23f';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('!', 64, 70);
};

const drawRocketBody = (ctx: Ctx, team: (typeof TEAM)[Side]): void => {
  [30, 86].forEach((x) =>
    [30, 66, 96].forEach((y) => {
      roundRect(ctx, x, y, 12, 20, 4);
      fillStroke(ctx, '#262626', 3);
    }),
  );
  roundRect(ctx, 36, 36, 56, 80, 8);
  fillStroke(ctx, '#5a5f4a');
  roundRect(ctx, 40, 8, 48, 34, 10);
  fillStroke(ctx, vGradient(ctx, 8, 42, hex(team.light), hex(team.main)));
  roundRect(ctx, 46, 12, 36, 12, 4);
  fillStroke(ctx, '#2b3d55', 3);
};

const drawRocketRack = (ctx: Ctx, team: (typeof TEAM)[Side]): void => {
  roundRect(ctx, 40, 44, 48, 52, 8);
  fillStroke(ctx, vGradient(ctx, 44, 96, '#7c8a5a', OLIVE));
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 3; c++) {
      const x = 50 + c * 14;
      const y = 56 + r * 22;
      circle(ctx, x, y, 6);
      fillStroke(ctx, '#222', 3);
      circle(ctx, x, y, 3);
      ctx.fillStyle = hex(team.main);
      ctx.fill();
    }
  }
};

const drawBunker = (ctx: Ctx, team: (typeof TEAM)[Side]): void => {
  // Back sandbags.
  for (let i = 0; i < 6; i++) {
    roundRect(ctx, 14 + i * 22, 56, 28, 16, 8);
    fillStroke(ctx, '#c8b083', 4);
  }
  // Concrete block: top face then front face (3/4 view).
  ctx.beginPath();
  ctx.moveTo(34, 52);
  ctx.lineTo(126, 52);
  ctx.lineTo(118, 72);
  ctx.lineTo(42, 72);
  ctx.closePath();
  fillStroke(ctx, '#b4bcc2');
  roundRect(ctx, 34, 70, 92, 54, 6);
  fillStroke(ctx, vGradient(ctx, 70, 124, '#9aa2a8', '#6d757b'));
  ctx.fillStyle = hex(team.main);
  ctx.fillRect(36, 74, 88, 8);
  roundRect(ctx, 52, 90, 56, 12, 4);
  fillStroke(ctx, '#1b1b1b', 4);
  // Front sandbags.
  for (let i = 0; i < 6; i++) {
    roundRect(ctx, 10 + i * 24, 120, 30, 20, 9);
    fillStroke(ctx, vGradient(ctx, 120, 140, '#dcc79a', '#b39a68'), 4);
  }
  // Flag pole.
  ctx.lineWidth = 5;
  ctx.strokeStyle = OUTLINE;
  ctx.beginPath();
  ctx.moveTo(122, 58);
  ctx.lineTo(122, 12);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#d9d9d9';
  ctx.beginPath();
  ctx.moveTo(122, 56);
  ctx.lineTo(122, 14);
  ctx.stroke();
};

const drawBunkerGun = (ctx: Ctx): void => {
  roundRect(ctx, 59, 20, 10, 40, 4);
  fillStroke(ctx, STEEL, 4);
  circle(ctx, 64, 64, 15);
  fillStroke(ctx, radial(ctx, 60, 58, 18, [[0, '#7c848a'], [1, '#41474c']]), 4);
};

const drawFlag = (ctx: Ctx, team: (typeof TEAM)[Side]): void => {
  ctx.beginPath();
  ctx.moveTo(2, 4);
  ctx.quadraticCurveTo(20, 0, 38, 8);
  ctx.lineTo(38, 26);
  ctx.quadraticCurveTo(20, 18, 2, 24);
  ctx.closePath();
  fillStroke(ctx, vGradient(ctx, 0, 26, hex(team.light), hex(team.main)), 3);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  const cx = 20;
  const cy = 14;
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 6 : 2.6;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  ctx.fill();
};

// ---------- Terrain ----------

const seededRandom = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

const drawGrassField = (ctx: Ctx, w: number, h: number, seed: number, tint: string): void => {
  const rand = seededRandom(seed);
  ctx.fillStyle = vGradient(ctx, 0, h, '#7fc25a', '#62a043');
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = rand() > 0.5 ? 'rgba(40,90,20,0.18)' : 'rgba(160,220,110,0.16)';
    ctx.beginPath();
    ctx.ellipse(rand() * w, rand() * h, 30 + rand() * 60, 16 + rand() * 30, rand() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.lineWidth = 2;
  for (let i = 0; i < 420; i++) {
    const x = rand() * w;
    const y = rand() * h;
    ctx.strokeStyle = rand() > 0.5 ? 'rgba(45,100,25,0.55)' : 'rgba(170,230,120,0.5)';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rand() - 0.5) * 4, y - 5 - rand() * 4);
    ctx.stroke();
  }
  for (let i = 0; i < 26; i++) {
    const x = rand() * w;
    const y = rand() * h;
    ctx.fillStyle = ['#fff6a8', '#ffffff', '#ffb3c7'][Math.floor(rand() * 3)] ?? '#fff';
    circle(ctx, x, y, 2.2);
    ctx.fill();
  }
  for (let i = 0; i < 9; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const r = 4 + rand() * 6;
    ctx.beginPath();
    ctx.ellipse(x, y, r * 1.3, r, 0, 0, Math.PI * 2);
    fillStroke(ctx, '#9aa0a0', 2);
  }
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, w, h);
};

const drawHinge = (ctx: Ctx, w: number): void => {
  ctx.fillStyle = vGradient(ctx, 0, 24, '#c9ced3', '#5d646b');
  ctx.fillRect(0, 0, w, 24);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillRect(0, 3, w, 2);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(0, 20, w, 4);
  for (let x = 30; x < w; x += 90) {
    roundRect(ctx, x, 4, 40, 16, 6);
    fillStroke(ctx, vGradient(ctx, 4, 20, '#e8ecef', '#8a9198'), 2);
  }
};

// ---------- FX & icons ----------

const drawStar = (ctx: Ctx, cx: number, cy: number, outer: number, inner: number, fill: string | CanvasGradient): void => {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  ctx.closePath();
  fillStroke(ctx, fill, 6);
};

const drawIcons = (scene: Phaser.Scene): void => {
  make(scene, 'icon_star', 112, 112, (ctx) => {
    drawStar(ctx, 56, 58, 50, 22, radial(ctx, 48, 40, 60, [[0, '#fff3a3'], [0.5, '#ffd23f'], [1, '#e89a00']]));
  });
  make(scene, 'icon_star_empty', 112, 112, (ctx) => drawStar(ctx, 56, 58, 50, 22, '#3a3f35'));
  make(scene, 'icon_trophy', 64, 64, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(14, 10);
    ctx.lineTo(50, 10);
    ctx.quadraticCurveTo(50, 38, 32, 40);
    ctx.quadraticCurveTo(14, 38, 14, 10);
    fillStroke(ctx, vGradient(ctx, 10, 40, '#ffe680', '#e8a600'), 4);
    ctx.lineWidth = 4;
    ctx.strokeStyle = OUTLINE;
    ctx.beginPath();
    ctx.arc(12, 20, 7, Math.PI * 0.5, Math.PI * 1.5);
    ctx.moveTo(52, 13);
    ctx.arc(52, 20, 7, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.stroke();
    roundRect(ctx, 27, 40, 10, 10, 2);
    fillStroke(ctx, '#e8a600', 3);
    roundRect(ctx, 18, 49, 28, 9, 3);
    fillStroke(ctx, '#8a5a1c', 3);
  });
  make(scene, 'icon_coin', 64, 64, (ctx) => {
    circle(ctx, 32, 32, 26);
    fillStroke(ctx, radial(ctx, 26, 24, 32, [[0, '#fff3a3'], [0.6, '#ffc93c'], [1, '#d18b00']]), 4);
    circle(ctx, 32, 32, 17);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#b87800';
    ctx.stroke();
    ctx.fillStyle = '#b87800';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('F', 32, 33);
  });
  make(scene, 'icon_hide', 64, 64, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(6, 32);
    ctx.quadraticCurveTo(32, 6, 58, 32);
    ctx.quadraticCurveTo(32, 58, 6, 32);
    fillStroke(ctx, '#ffffff', 4);
    circle(ctx, 32, 32, 10);
    fillStroke(ctx, '#9b5de5', 3);
    ctx.lineWidth = 6;
    ctx.strokeStyle = OUTLINE;
    ctx.beginPath();
    ctx.moveTo(12, 54);
    ctx.lineTo(52, 10);
    ctx.stroke();
  });
  make(scene, 'icon_boost', 64, 64, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(36, 4);
    ctx.lineTo(12, 36);
    ctx.lineTo(30, 36);
    ctx.lineTo(24, 60);
    ctx.lineTo(52, 24);
    ctx.lineTo(34, 24);
    ctx.closePath();
    fillStroke(ctx, vGradient(ctx, 4, 60, '#fff38a', '#ff9d00'), 4);
  });
  make(scene, 'icon_radar', 64, 64, (ctx) => {
    circle(ctx, 32, 32, 26);
    fillStroke(ctx, radial(ctx, 32, 32, 26, [[0, '#2e7d32'], [1, '#0f3d12']]), 4);
    ctx.strokeStyle = '#7dff8a';
    ctx.lineWidth = 2;
    [9, 17].forEach((r) => {
      circle(ctx, 32, 32, r);
      ctx.stroke();
    });
    ctx.beginPath();
    ctx.moveTo(32, 32);
    ctx.lineTo(52, 18);
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#ff5252';
    circle(ctx, 22, 40, 3.5);
    ctx.fill();
  });
  make(scene, 'icon_shield', 64, 64, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(32, 4);
    ctx.lineTo(56, 13);
    ctx.quadraticCurveTo(56, 46, 32, 60);
    ctx.quadraticCurveTo(8, 46, 8, 13);
    ctx.closePath();
    fillStroke(ctx, vGradient(ctx, 4, 60, '#8ff0ff', '#1e88e5'), 4);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.moveTo(32, 12);
    ctx.lineTo(32, 50);
    ctx.quadraticCurveTo(15, 40, 15, 18);
    ctx.closePath();
    ctx.fill();
  });
  make(scene, 'icon_sound', 64, 64, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(8, 24);
    ctx.lineTo(20, 24);
    ctx.lineTo(34, 10);
    ctx.lineTo(34, 54);
    ctx.lineTo(20, 40);
    ctx.lineTo(8, 40);
    ctx.closePath();
    fillStroke(ctx, '#ffffff', 4);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(36, 32, 12, -0.8, 0.8);
    ctx.moveTo(44, 16);
    ctx.arc(36, 32, 20, -0.8, 0.8);
    ctx.stroke();
  });
  make(scene, 'icon_mute', 64, 64, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(8, 24);
    ctx.lineTo(20, 24);
    ctx.lineTo(34, 10);
    ctx.lineTo(34, 54);
    ctx.lineTo(20, 40);
    ctx.lineTo(8, 40);
    ctx.closePath();
    fillStroke(ctx, '#ffffff', 4);
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#ff5252';
    ctx.beginPath();
    ctx.moveTo(40, 22);
    ctx.lineTo(58, 42);
    ctx.moveTo(58, 22);
    ctx.lineTo(40, 42);
    ctx.stroke();
  });
};

const drawFx = (scene: Phaser.Scene): void => {
  make(scene, 'fx_soft', 64, 64, (ctx) => {
    ctx.fillStyle = radial(ctx, 32, 32, 32, [[0, 'rgba(255,255,255,1)'], [0.4, 'rgba(255,255,255,0.6)'], [1, 'rgba(255,255,255,0)']]);
    ctx.fillRect(0, 0, 64, 64);
  });
  make(scene, 'fx_spark', 32, 32, (ctx) => {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(20, 12);
    ctx.lineTo(32, 16);
    ctx.lineTo(20, 20);
    ctx.lineTo(16, 32);
    ctx.lineTo(12, 20);
    ctx.lineTo(0, 16);
    ctx.lineTo(12, 12);
    ctx.closePath();
    ctx.fill();
  });
  make(scene, 'fx_smoke', 64, 64, (ctx) => {
    ctx.fillStyle = radial(ctx, 32, 32, 30, [[0, 'rgba(90,90,90,0.9)'], [0.7, 'rgba(70,70,70,0.5)'], [1, 'rgba(60,60,60,0)']]);
    ctx.fillRect(0, 0, 64, 64);
  });
  make(scene, 'fx_fire', 64, 64, (ctx) => {
    ctx.fillStyle = radial(ctx, 32, 32, 30, [
      [0, 'rgba(255,255,220,1)'],
      [0.3, 'rgba(255,214,64,1)'],
      [0.7, 'rgba(255,110,20,0.8)'],
      [1, 'rgba(200,40,0,0)'],
    ]);
    ctx.fillRect(0, 0, 64, 64);
  });
  make(scene, 'fx_debris', 14, 10, (ctx) => {
    roundRect(ctx, 1, 1, 12, 8, 2);
    fillStroke(ctx, '#6b4f2a', 2);
  });
  make(scene, 'fx_ring', 128, 128, (ctx) => {
    circle(ctx, 64, 64, 58);
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
  });
  make(scene, 'fx_crater', 96, 96, (ctx) => {
    ctx.fillStyle = radial(ctx, 48, 48, 46, [[0, 'rgba(20,14,8,0.85)'], [0.55, 'rgba(50,34,18,0.55)'], [1, 'rgba(50,34,18,0)']]);
    ctx.fillRect(0, 0, 96, 96);
  });
  make(scene, 'fx_shell', 24, 24, (ctx) => {
    circle(ctx, 12, 12, 8);
    fillStroke(ctx, radial(ctx, 9, 9, 10, [[0, '#888'], [1, '#222']]), 3);
  });
  make(scene, 'fx_rocket', 20, 44, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(10, 2);
    ctx.quadraticCurveTo(17, 10, 16, 30);
    ctx.lineTo(4, 30);
    ctx.quadraticCurveTo(3, 10, 10, 2);
    fillStroke(ctx, '#e8e8e8', 3);
    ctx.fillStyle = '#ff4d4d';
    ctx.beginPath();
    ctx.moveTo(10, 2);
    ctx.quadraticCurveTo(15, 7, 15.5, 12);
    ctx.lineTo(4.5, 12);
    ctx.quadraticCurveTo(5, 7, 10, 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(4, 26);
    ctx.lineTo(0, 38);
    ctx.lineTo(8, 32);
    ctx.lineTo(12, 32);
    ctx.lineTo(20, 38);
    ctx.lineTo(16, 26);
    ctx.closePath();
    fillStroke(ctx, '#555', 2);
  });
  make(scene, 'fx_tracer', 10, 34, (ctx) => {
    ctx.fillStyle = vGradient(ctx, 0, 34, 'rgba(255,255,220,1)', 'rgba(255,170,0,0)');
    roundRect(ctx, 1, 0, 8, 34, 4);
    ctx.fill();
  });
  make(scene, 'fx_shadow', 96, 40, (ctx) => {
    ctx.fillStyle = radial(ctx, 48, 20, 46, [[0, 'rgba(0,0,0,0.45)'], [1, 'rgba(0,0,0,0)']]);
    ctx.save();
    ctx.scale(1, 40 / 96);
    ctx.fillRect(0, 0, 96, 96);
    ctx.restore();
  });
  make(scene, 'fx_shield', 180, 180, (ctx) => {
    ctx.fillStyle = radial(ctx, 90, 90, 88, [
      [0, 'rgba(120,230,255,0.05)'],
      [0.75, 'rgba(120,230,255,0.22)'],
      [0.93, 'rgba(180,250,255,0.75)'],
      [1, 'rgba(180,250,255,0)'],
    ]);
    ctx.fillRect(0, 0, 180, 180);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(90, 90, 70, Math.PI * 1.1, Math.PI * 1.45);
    ctx.stroke();
  });
  make(scene, 'fx_rays', 512, 512, (ctx) => {
    ctx.translate(256, 256);
    for (let i = 0; i < 16; i++) {
      ctx.rotate((Math.PI * 2) / 16);
      ctx.fillStyle = 'rgba(255,230,120,0.22)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-40, -256);
      ctx.lineTo(40, -256);
      ctx.closePath();
      ctx.fill();
    }
  });
  make(scene, 'fx_mine_light', 24, 24, (ctx) => {
    ctx.fillStyle = radial(ctx, 12, 12, 12, [[0, 'rgba(255,255,255,1)'], [0.35, 'rgba(255,40,40,1)'], [1, 'rgba(255,0,0,0)']]);
    ctx.fillRect(0, 0, 24, 24);
  });
  make(scene, 'fx_question', 64, 64, (ctx) => {
    circle(ctx, 32, 32, 26);
    fillStroke(ctx, radial(ctx, 26, 24, 30, [[0, '#c9a6ff'], [1, '#6a2fc1']]), 4);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', 32, 34);
  });
};

export const generateTextures = (scene: Phaser.Scene): void => {
  (['P1', 'P2'] as const).forEach((side) => {
    const team = TEAM[side];
    make(scene, `tank_body_${side}`, 128, 128, (ctx) => drawTankBody(ctx, team));
    make(scene, `tank_turret_${side}`, 128, 128, (ctx) => drawTankTurret(ctx, team));
    make(scene, `mortar_${side}`, 128, 128, (ctx) => drawSoldier(ctx, team));
    make(scene, `bomb_${side}`, 128, 128, (ctx) => drawMine(ctx, team));
    make(scene, `rocket_body_${side}`, 128, 128, (ctx) => drawRocketBody(ctx, team));
    make(scene, `rocket_turret_${side}`, 128, 128, (ctx) => drawRocketRack(ctx, team));
    make(scene, `bunker_${side}`, 160, 150, (ctx) => drawBunker(ctx, team));
    make(scene, `flag_${side}`, 40, 28, (ctx) => drawFlag(ctx, team));
  });
  make(scene, 'bunker_gun', 128, 128, drawBunkerGun);
  make(scene, 'field_top', GAME_WIDTH, 480, (ctx) => drawGrassField(ctx, GAME_WIDTH, 480, 7, 'rgba(255,60,40,0.05)'));
  make(scene, 'field_bottom', GAME_WIDTH, 480, (ctx) => drawGrassField(ctx, GAME_WIDTH, 480, 99, 'rgba(40,110,255,0.05)'));
  make(scene, 'hinge', GAME_WIDTH, LAYOUT.hingeHalf * 2, (ctx) => drawHinge(ctx, GAME_WIDTH));
  drawIcons(scene);
  drawFx(scene);
};
