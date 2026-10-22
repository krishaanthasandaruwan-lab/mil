// Fold-Mirror Coordinate Mapping, Pre-Created Clash Animations & Main Bunker Siege Engine

const CombatEngine = {
    animFrame: null,
    particles: [],
    projectiles: [],
    clashes: [],

    // Maps Player 1's bottom screen coordinate (x, y) to the folded overlap coordinate
    // When folded along the horizontal hinge, P1's (x, y) lands on P2's (x, canvasHeight - y)
    mirrorY(y, height) {
        return height - y;
    },

    runFoldBattle(p1Units, p2Units, p1Bunker, p2Bunker, onComplete) {
        const canvas = document.getElementById('canvas-outer');
        const ctx = canvas.getContext('2d');
        const ticker = document.getElementById('combat-log-ticker');
        const W = canvas.width;
        const H = canvas.height;

        this.particles = [];
        this.projectiles = [];
        this.clashes = [];

        // Normalize coordinates onto the Outer Display (520x380)
        const scaleY = H / 250;
        const activeP1 = p1Units.map(u => ({
            ...u,
            x: u.x,
            y: this.mirrorY(u.y, 250) * scaleY,
            hp: u.maxHp,
            alive: true,
            side: 'P1'
        }));

        const activeP2 = p2Units.map(u => ({
            ...u,
            x: u.x,
            y: u.y * scaleY,
            hp: u.maxHp,
            alive: true,
            side: 'P2'
        }));

        const b1 = { x: p1Bunker.x, y: (250 - p1Bunker.y) * scaleY, hp: p1Bunker.hp, maxHp: p1Bunker.maxHp };
        const b2 = { x: p2Bunker.x, y: p2Bunker.y * scaleY, hp: p2Bunker.hp, maxHp: p2Bunker.maxHp };

        let step = 0;
        const maxSteps = 260;

        const spawnExplosion = (x, y, color, count = 18) => {
            SoundFX.playExplosion();
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 1 + Math.random() * 4;
                this.particles.push({
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 28,
                    color
                });
            }
        };

        // Pre-compute tactical engagements (Direct Fold Overlaps + Range/Hidden Traps)
        const loop = () => {
            step++;
            ctx.fillStyle = '#1b2618';
            ctx.fillRect(0, 0, W, H);

            // Draw Tactical Grid
            ctx.strokeStyle = 'rgba(255,255,255,0.06)';
            ctx.lineWidth = 1;
            for (let gx = 0; gx < W; gx += 40) {
                ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
            }
            for (let gy = 0; gy < H; gy += 40) {
                ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
            }

            // Phase 1 (Steps 1-90): Direct Fold Overlap & Hidden Bomb Ambush Resolution
            if (step === 25) {
                ticker.textContent = '💥 PHASE 1: නැවුම් ලක්ෂ්‍ය සමපාත වීම සහ සැඟවූ බෝම්බ ක්‍රියාත්මක වීම!';
                activeP1.forEach(u1 => {
                    if (!u1.alive) return;
                    activeP2.forEach(u2 => {
                        if (!u2.alive) return;
                        const dist = Math.hypot(u1.x - u2.x, u1.y - u2.y);
                        const engageDist = Math.max(u1.range, u2.range) * 0.65;

                        if (dist <= engageDist) {
                            // Check RPS Counter Logic
                            let dmgTo2 = u1.atk;
                            let dmgTo1 = u2.atk;

                            const cat1 = UNIT_CATALOG[u1.type];
                            const cat2 = UNIT_CATALOG[u2.type];

                            if (cat1.beats === u2.type) dmgTo2 *= 2.5;
                            if (cat2.beats === u1.type) dmgTo1 *= 2.5;

                            // Hidden Ambush Bonus!
                            if (u1.hidden && !u2.revealed) {
                                dmgTo2 *= 1.8;
                                ticker.textContent = `👻 සැඟවූ ${cat1.shortName} මගින් ප්‍රතිවාදියාගේ ${cat2.shortName} විනාශ කළා!`;
                            }
                            if (u2.hidden && !u1.revealed) {
                                dmgTo1 *= 1.8;
                            }

                            this.projectiles.push({
                                sx: u1.x, sy: u1.y, tx: u2.x, ty: u2.y, progress: 0, color: '#4cc9f0'
                            });
                            this.projectiles.push({
                                sx: u2.x, sy: u2.y, tx: u1.x, ty: u1.y, progress: 0, color: '#ff4d6d'
                            });

                            u2.hp -= dmgTo2;
                            u1.hp -= dmgTo1;

                            if (u2.hp <= 0) { u2.alive = false; spawnExplosion(u2.x, u2.y, '#ff4d6d'); }
                            if (u1.hp <= 0) { u1.alive = false; spawnExplosion(u1.x, u1.y, '#4cc9f0'); }
                        }
                    });
                });
            }

            // Phase 2 (Step 120): Surviving Units Attack Enemy Units or Main Bunker within Range
            if (step === 120) {
                ticker.textContent = '🏰 PHASE 2: ඉතිරි වූ ඒකක මගින් ප්‍රධාන බංකර (Main Bunkers) වෙත ප්‍රහාර එල්ල කිරීම!';
                activeP1.filter(u => u.alive).forEach(u1 => {
                    const distToBunker2 = Math.hypot(u1.x - b2.x, u1.y - b2.y);
                    // Attack enemy bunker if within extended siege range or paper-fold hit zone
                    if (distToBunker2 <= u1.range * 1.6) {
                        b2.hp = Math.max(0, b2.hp - u1.atk * 1.8);
                        this.projectiles.push({ sx: u1.x, sy: u1.y, tx: b2.x, ty: b2.y, progress: 0, color: '#ffd166' });
                        spawnExplosion(b2.x, b2.y, '#ff9f1c', 25);
                    } else {
                        // Chip damage from surviving unit control
                        b2.hp = Math.max(0, b2.hp - u1.atk * 0.6);
                        this.projectiles.push({ sx: u1.x, sy: u1.y, tx: b2.x, ty: b2.y, progress: 0, color: '#4cc9f0' });
                    }
                });

                activeP2.filter(u => u.alive).forEach(u2 => {
                    const distToBunker1 = Math.hypot(u2.x - b1.x, u2.y - b1.y);
                    if (distToBunker1 <= u2.range * 1.6) {
                        b1.hp = Math.max(0, b1.hp - u2.atk * 1.8);
                        this.projectiles.push({ sx: u2.x, sy: u2.y, tx: b1.x, ty: b1.y, progress: 0, color: '#ff4d6d' });
                        spawnExplosion(b1.x, b1.y, '#e63946', 25);
                    } else {
                        b1.hp = Math.max(0, b1.hp - u2.atk * 0.6);
                        this.projectiles.push({ sx: u2.x, sy: u2.y, tx: b1.x, ty: b1.y, progress: 0, color: '#ff4d6d' });
                    }
                });

                document.getElementById('outer-p1-bar').style.width = `${(b1.hp / b1.maxHp) * 100}%`;
                document.getElementById('outer-p2-bar').style.width = `${(b2.hp / b2.maxHp) * 100}%`;
            }

            // Draw Main Bunkers on Outer Display
            this.drawBunker(ctx, b1.x, b1.y, '🔵 P1 BUNKER', b1.hp, b1.maxHp, '#4cc9f0');
            this.drawBunker(ctx, b2.x, b2.y, '🔴 P2 BUNKER', b2.hp, b2.maxHp, '#ff4d6d');

            // Draw Units
            [...activeP1, ...activeP2].forEach(u => {
                if (!u.alive) return;
                ctx.save();
                ctx.beginPath();
                ctx.arc(u.x, u.y, 18, 0, Math.PI * 2);
                ctx.fillStyle = u.side === 'P1' ? 'rgba(76, 201, 240, 0.25)' : 'rgba(255, 77, 109, 0.25)';
                ctx.fill();
                ctx.lineWidth = 2;
                ctx.strokeStyle = u.side === 'P1' ? '#4cc9f0' : '#ff4d6d';
                ctx.stroke();

                ctx.font = '20px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(UNIT_CATALOG[u.type].emoji, u.x, u.y);
                ctx.restore();
            });

            // Animate Projectiles
            this.projectiles.forEach(p => {
                p.progress += 0.05;
                if (p.progress <= 1) {
                    const cx = p.sx + (p.tx - p.sx) * p.progress;
                    const cy = p.sy + (p.ty - p.sy) * p.progress;
                    ctx.beginPath();
                    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
                    ctx.fillStyle = p.color;
                    ctx.fill();
                }
            });

            // Animate Explosion Particles
            this.particles.forEach(pt => {
                pt.x += pt.vx;
                pt.y += pt.vy;
                pt.life--;
                if (pt.life > 0) {
                    ctx.fillStyle = pt.color;
                    ctx.fillRect(pt.x, pt.y, 4, 4);
                }
            });

            if (step < maxSteps) {
                this.animFrame = requestAnimationFrame(loop);
            } else {
                const p1AliveCount = activeP1.filter(u => u.alive).length;
                const p2AliveCount = activeP2.filter(u => u.alive).length;
                onComplete({
                    b1Hp: Math.round(b1.hp),
                    b2Hp: Math.round(b2.hp),
                    p1AliveCount,
                    p2AliveCount
                });
            }
        };

        this.animFrame = requestAnimationFrame(loop);
    },

    drawBunker(ctx, x, y, label, hp, maxHp, color) {
        ctx.save();
        ctx.fillStyle = '#111';
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(x - 28, y - 22, 56, 44, 8);
        ctx.fill();
        ctx.stroke();

        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🏰', x, y + 4);

        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = '#fff';
        ctx.fillText(`${label} (${Math.round(hp)})`, x, y - 28);
        ctx.restore();
    }
};