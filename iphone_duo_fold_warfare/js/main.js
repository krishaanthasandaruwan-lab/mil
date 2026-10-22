// Main Game Controller, Dual-Screen Canvas Interaction & UI Manager

const UI = {
    openModal(id) {
        document.getElementById(id).classList.remove('hidden');
    },
    closeModal(id) {
        document.getElementById(id).classList.add('hidden');
    },
    syncHeader() {
        document.getElementById('trophy-count').textContent = PlayerProfile.trophies;
        document.getElementById('league-name').textContent = PlayerProfile.getLeagueName();
        document.getElementById('coin-count').textContent = PlayerProfile.coins;
        document.getElementById('trial-count').textContent = PlayerProfile.isFullGameUnlocked
            ? 'UNLIMITED 🔓'
            : `${PlayerProfile.trialsLeft} / 3`;
    },
    syncSkills() {
        document.getElementById('cnt-stealth').textContent = `x${PlayerProfile.skills.stealth}`;
        document.getElementById('cnt-radar').textContent = `x${PlayerProfile.skills.radar}`;
        document.getElementById('cnt-shield').textContent = `x${PlayerProfile.skills.shield}`;
        document.getElementById('cnt-boost').textContent = `x${PlayerProfile.skills.boost}`;
    },
    renderSkinStore() {
        const grid = document.getElementById('skins-store-grid');
        grid.innerHTML = '';
        SKIN_CATALOG.forEach(skin => {
            const owned = PlayerProfile.unlockedSkins.includes(skin.id);
            const active = PlayerProfile.equippedSkin === skin.id;
            const div = document.createElement('div');
            div.className = 'store-card';
            div.innerHTML = `
                <div class="big-icon" style="background:${skin.primary};padding:8px 16px;border-radius:8px;border:2px solid #000;">🎨</div>
                <h4>${skin.name}</h4>
                <p>${owned ? 'Owned' : `🪙 ${skin.cost} Coins`}</p>
                <button class="btn-cartoon ${active ? 'btn-orange' : 'btn-green'}" onclick="Store.buyOrEquipSkin('${skin.id}')">
                    ${active ? '✅ EQUIPPED' : (owned ? 'EQUIP' : `BUY (${skin.cost})`)}
                </button>
            `;
            grid.appendChild(div);
        });
    },
    renderUpgrades() {
        const grid = document.getElementById('upgrade-cards-grid');
        grid.innerHTML = '';
        Object.keys(UNIT_CATALOG).forEach(key => {
            const u = UNIT_CATALOG[key];
            const lvl = PlayerProfile.unitLevels[key];
            const cost = lvl * 150;
            const div = document.createElement('div');
            div.className = 'store-card';
            div.innerHTML = `
                <div class="big-icon">${u.emoji}</div>
                <h4>${u.name} (Lv.${lvl})</h4>
                <p>HP: ${Math.round(u.baseHp * (1 + (lvl-1)*0.2))} | ATK: ${Math.round(u.baseAtk * (1 + (lvl-1)*0.2))}</p>
                <button class="btn-cartoon btn-green" onclick="Store.upgradeUnit('${key}')">
                    ⬆️ Upgrade (🪙 ${cost})
                </button>
            `;
            grid.appendChild(div);
        });
    }
};

const Game = {
    mode: 'online', // 'online' or 'local'
    activeTurn: 'P1',
    selectedDeckIndex: 0,
    activeSkill: null,
    radarRevealed: false,

    opponent: {
        name: 'Commander Rex',
        trophies: 480
    },

    p1DeckUsed: new Array(10).fill(false),
    p2DeckUsed: new Array(10).fill(false),

    p1Units: [],
    p2Units: [],

    p1Bunker: { x: 260, y: 205, hp: 1000, maxHp: 1000 },
    p2Bunker: { x: 260, y: 45, hp: 1000, maxHp: 1000 },

    init() {
        UI.syncHeader();
        UI.syncSkills();
        UI.renderSkinStore();
        UI.renderUpgrades();
        this.RollNewOpponent();
        this.renderDeckDock();
        this.bindCanvasEvents();
        this.spawnAIUnits();
        this.renderInnerScreens();
    },

    setMode(m) {
        this.mode = m;
        document.getElementById('mode-online').classList.toggle('active', m === 'online');
        document.getElementById('mode-local').classList.toggle('active', m === 'local');
        this.resetCurrentPlacements();
    },

    RollNewOpponent() {
        const names = ['General Viper', 'Captain Blitz', 'Major Kobra', 'Sniper Wolf', 'Tanker Bruno'];
        const name = names[Math.floor(Math.random() * names.length)];
        const tDiff = Math.floor(Math.random() * 240) - 60;
        this.opponent.name = name;
        this.opponent.trophies = Math.max(100, PlayerProfile.trophies + tDiff);

        const winDelta = PlayerProfile.calculateTrophyDelta(this.opponent.trophies, true);
        document.getElementById('opp-name').textContent = this.opponent.name;
        document.getElementById('opp-trophies').textContent = `🏆 ${this.opponent.trophies}`;
        document.getElementById('win-trophy-preview').textContent = `+${winDelta} 🏆`;
    },

    toggleSkill(skillKey) {
        if (PlayerProfile.skills[skillKey] <= 0) {
            alert('❌ මෙම Skill එක අවසන් වී ඇත! Store වෙතින් මිලදී ගන්න.');
            return;
        }
        this.activeSkill = this.activeSkill === skillKey ? null : skillKey;
        document.querySelectorAll('.skill-btn').forEach(b => b.classList.remove('active'));
        if (this.activeSkill === 'stealth') document.getElementById('skill-hide').classList.add('active');
        if (this.activeSkill === 'shield') document.getElementById('skill-shield').classList.add('active');
        if (this.activeSkill === 'boost') document.getElementById('skill-boost').classList.add('active');
    },

    useInstantSkill(skillKey) {
        if (skillKey === 'radar') {
            if (PlayerProfile.skills.radar <= 0) {
                alert('❌ Radar Scan අවසන් වී ඇත! Store වෙතින් මිලදී ගන්න.');
                return;
            }
            PlayerProfile.skills.radar--;
            this.radarRevealed = true;
            this.p2Units.forEach(u => u.revealed = true);
            SoundFX.playPlace(true);
            UI.syncSkills();
            this.renderInnerScreens();
            alert('📡 RADAR SCAN: ප්‍රතිවාදියා සඟවා තැබූ සියලුම බෝම්බ සහ ඒකක හෙළිදරව් විය!');
        }
    },

    renderDeckDock() {
        const container = document.getElementById('unit-slots-container');
        container.innerHTML = '';
        const usedArray = this.activeTurn === 'P1' ? this.p1DeckUsed : this.p2DeckUsed;

        DEFAULT_10_DECK.forEach((unitKey, idx) => {
            const u = UNIT_CATALOG[unitKey];
            const lvl = PlayerProfile.unitLevels[unitKey];
            const slot = document.createElement('div');
            slot.className = `unit-slot ${this.selectedDeckIndex === idx ? 'selected' : ''} ${usedArray[idx] ? 'deployed' : ''}`;
            slot.onclick = () => {
                this.selectedDeckIndex = idx;
                this.renderDeckDock();
            };
            slot.innerHTML = `
                <span class="u-lvl">Lv.${lvl}</span>
                <span class="u-emoji">${u.emoji}</span>
                <span class="u-title">${u.shortName}</span>
            `;
            container.appendChild(slot);
        });
    },

    bindCanvasEvents() {
        const bottomCanvas = document.getElementById('canvas-bottom');
        const topCanvas = document.getElementById('canvas-top');

        bottomCanvas.addEventListener('click', (e) => {
            if (this.activeTurn !== 'P1') return;
            const rect = bottomCanvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.placeUnitOnMap('P1', x, y);
        });

        topCanvas.addEventListener('click', (e) => {
            if (this.mode !== 'local' || this.activeTurn !== 'P2') return;
            const rect = topCanvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.placeUnitOnMap('P2', x, y);
        });
    },

    placeUnitOnMap(player, x, y) {
        const usedArr = player === 'P1' ? this.p1DeckUsed : this.p2DeckUsed;
        const unitList = player === 'P1' ? this.p1Units : this.p2Units;

        if (usedArr[this.selectedDeckIndex]) {
            const nextIdx = usedArr.findIndex(u => !u);
            if (nextIdx === -1) {
                alert('✅ ඔබේ අයිටම් 10 ම ස්ථානගත කර අවසන්! දැන් FOLD & FIGHT බොත්තම ඔබන්න.');
                return;
            }
            this.selectedDeckIndex = nextIdx;
        }

        const unitType = DEFAULT_10_DECK[this.selectedDeckIndex];
        const base = UNIT_CATALOG[unitType];
        const lvl = PlayerProfile.unitLevels[unitType];
        const mult = 1 + (lvl - 1) * 0.2;

        let isHidden = false;
        let atkBoost = 1;

        if (this.activeSkill === 'stealth') {
            isHidden = true;
            PlayerProfile.skills.stealth--;
            this.activeSkill = null;
        } else if (this.activeSkill === 'boost') {
            atkBoost = 1.5;
            PlayerProfile.skills.boost--;
            this.activeSkill = null;
        } else if (this.activeSkill === 'shield') {
            if (player === 'P1') this.p1Bunker.hp += 350;
            else this.p2Bunker.hp += 350;
            PlayerProfile.skills.shield--;
            this.activeSkill = null;
        }

        unitList.push({
            type: unitType,
            x,
            y,
            maxHp: Math.round(base.baseHp * mult),
            atk: Math.round(base.baseAtk * mult * atkBoost),
            range: base.attackRange,
            hidden: isHidden,
            revealed: false
        });

        usedArr[this.selectedDeckIndex] = true;
        SoundFX.playPlace(isHidden);

        const nextAvailable = usedArr.findIndex(u => !u);
        if (nextAvailable !== -1) this.selectedDeckIndex = nextAvailable;

        UI.syncSkills();
        document.querySelectorAll('.skill-btn').forEach(b => b.classList.remove('active'));
        this.renderDeckDock();
        this.renderInnerScreens();

        if (this.mode === 'local' && player === 'P1' && this.p1Units.length > 0) {
            document.getElementById('btn-switch-p2').classList.remove('hidden');
        }
    },

    finishPlayer1Turn() {
        this.activeTurn = 'P2';
        this.selectedDeckIndex = 0;
        document.getElementById('turn-banner').textContent = 'PLAYER 2: ඉහළ තිරයේ ඔබේ ඒකක ස්ථානගත කරන්න';
        document.getElementById('btn-switch-p2').classList.add('hidden');
        this.renderDeckDock();
        this.renderInnerScreens();
    },

    spawnAIUnits() {
        this.p2Units = [];
        this.p2DeckUsed = new Array(10).fill(true);
        DEFAULT_10_DECK.forEach((unitType, idx) => {
            const base = UNIT_CATALOG[unitType];
            // Place some AI units strategically near bunker or mirrored zones, and hide 2 bombs!
            const isHiddenBomb = (unitType === 'bomb' && idx >= 7);
            this.p2Units.push({
                type: unitType,
                x: 70 + Math.random() * 380,
                y: 45 + Math.random() * 170,
                maxHp: base.baseHp,
                atk: base.baseAtk,
                range: base.attackRange,
                hidden: isHiddenBomb,
                revealed: false
            });
        });
    },

    resetCurrentPlacements() {
        this.activeTurn = 'P1';
        this.p1Units = [];
        this.p1DeckUsed = new Array(10).fill(false);
        this.p2DeckUsed = new Array(10).fill(false);
        this.radarRevealed = false;
        this.p1Bunker = { x: 260, y: 205, hp: 1000, maxHp: 1000 };
        this.p2Bunker = { x: 260, y: 45, hp: 1000, maxHp: 1000 };

        if (this.mode === 'online') {
            this.spawnAIUnits();
        } else {
            this.p2Units = [];
        }

        document.getElementById('turn-banner').textContent = 'PLAYER 1: ඔබේ ඒකක 10 සිතියමේ ස්ථානගත කරන්න';
        document.getElementById('btn-switch-p2').classList.add('hidden');
        this.selectedDeckIndex = 0;
        this.renderDeckDock();
        this.renderInnerScreens();
    },

    renderInnerScreens() {
        const skin = SKIN_CATALOG.find(s => s.id === PlayerProfile.equippedSkin) || SKIN_CATALOG[0];
        this.drawScreenCanvas('canvas-top', this.p2Units, this.p2Bunker, 'P2', skin);
        this.drawScreenCanvas('canvas-bottom', this.p1Units, this.p1Bunker, 'P1', skin);

        document.getElementById('p1-unit-count').textContent = `${this.p1Units.length}/10`;
        document.getElementById('p2-unit-count').textContent = `${this.p2Units.length}/10`;
        document.getElementById('p1-bunker-hp').textContent = `${this.p1Bunker.hp}/${this.p1Bunker.maxHp}`;
        document.getElementById('p2-bunker-hp').textContent = `${this.p2Bunker.hp}/${this.p2Bunker.maxHp}`;
    },

    drawScreenCanvas(canvasId, units, bunker, side, skin) {
        const canvas = document.getElementById(canvasId);
        const ctx = canvas.getContext('2d');
        const W = canvas.width;
        const H = canvas.height;

        ctx.fillStyle = skin.primary;
        ctx.fillRect(0, 0, W, H);

        // Draw Cartoon Tactical Grid
        ctx.strokeStyle = skin.grid;
        ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 35) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
        }
        for (let y = 0; y < H; y += 35) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        }

        // Draw Main Bunker (Town Hall)
        CombatEngine.drawBunker(
            ctx,
            bunker.x,
            bunker.y,
            side === 'P1' ? 'MAIN BUNKER' : 'ENEMY BUNKER',
            bunker.hp,
            bunker.maxHp,
            side === 'P1' ? '#4cc9f0' : '#ff4d6d'
        );

        // Draw Placed Units
        units.forEach(u => {
            // Hide opponent's stealth units unless radar was used
            if (side === 'P2' && u.hidden && !u.revealed && this.activeTurn === 'P1') {
                return;
            }

            ctx.save();
            // Draw Attack Zone Circle
            ctx.beginPath();
            ctx.arc(u.x, u.y, u.range * 0.45, 0, Math.PI * 2);
            ctx.fillStyle = side === 'P1' ? 'rgba(76, 201, 240, 0.14)' : 'rgba(255, 77, 109, 0.14)';
            ctx.fill();
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = side === 'P1' ? '#4cc9f0' : '#ff4d6d';
            ctx.stroke();
            ctx.setLineDash([]);

            // Unit Badge
            ctx.beginPath();
            ctx.arc(u.x, u.y, 16, 0, Math.PI * 2);
            ctx.fillStyle = u.hidden ? '#5a189a' : '#111';
            ctx.fill();
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = u.hidden ? '#ffd166' : (side === 'P1' ? '#4cc9f0' : '#ff4d6d');
            ctx.stroke();

            ctx.font = '18px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(UNIT_CATALOG[u.type].emoji, u.x, u.y);

            if (u.hidden) {
                ctx.font = 'bold 9px sans-serif';
                ctx.fillStyle = '#ffd166';
                ctx.fillText('👻 HIDDEN', u.x, u.y - 22);
            }
            ctx.restore();
        });

        // Show Mirror Fold Preview Crosshair of Player 1's units on Top Screen
        if (side === 'P2') {
            this.p1Units.forEach(u1 => {
                const my = CombatEngine.mirrorY(u1.y, H);
                ctx.save();
                ctx.strokeStyle = 'rgba(255, 209, 102, 0.45)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(u1.x, my, 10, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            });
        }
    },

    triggerFoldAndFight() {
        // Check 3-Trial Limit
        if (!PlayerProfile.isFullGameUnlocked && PlayerProfile.trialsLeft <= 0) {
            UI.openModal('paywall-modal');
            return;
        }

        if (this.p1Units.length === 0) {
            alert('⚠️ කරුණාකර සටන් කිරීමට පෙර අවම වශයෙන් එක් ඒකකයක් හෝ ඔබේ සිතියමේ ස්ථානගත කරන්න!');
            return;
        }

        if (!PlayerProfile.isFullGameUnlocked) {
            PlayerProfile.trialsLeft--;
            UI.syncHeader();
        }

        SoundFX.playFold();

        // Switch UI from Unfolded Dual Screen to Folded Outer Display
        document.getElementById('iphone-duo-unfolded').classList.add('hidden');
        document.getElementById('iphone-duo-folded').classList.remove('hidden');
        document.getElementById('btn-unfold-next').classList.add('hidden');
        document.getElementById('device-state-label').textContent = '📲 iPhone Duo: පිටත තිරය (FOLDED OUTER DISPLAY - LIVE BATTLE)';

        CombatEngine.runFoldBattle(
            this.p1Units,
            this.p2Units,
            this.p1Bunker,
            this.p2Bunker,
            (result) => {
                const p1Score = result.b1Hp + result.p1AliveCount * 80;
                const p2Score = result.b2Hp + result.p2AliveCount * 80;
                const isWin = p1Score >= p2Score;

                const delta = PlayerProfile.calculateTrophyDelta(this.opponent.trophies, isWin);
                PlayerProfile.trophies = Math.max(0, PlayerProfile.trophies + delta);
                const earnedCoins = isWin ? 120 : 40;
                PlayerProfile.coins += earnedCoins;

                if (isWin) SoundFX.playVictory();
                UI.syncHeader();

                const ticker = document.getElementById('combat-log-ticker');
                ticker.textContent = isWin
                    ? `🏆 VICTORY! ඔබ ජයග්‍රහණය කළා! (${delta >= 0 ? '+' + delta : delta} Trophies | +${earnedCoins} Coins)`
                    : `💥 DEFEAT! ප්‍රතිවාදියා ජයගත්තා! (${delta} Trophies | +${earnedCoins} Coins)`;

                document.getElementById('btn-unfold-next').classList.remove('hidden');
            }
        );
    },

    unfoldForNextRound() {
        document.getElementById('iphone-duo-folded').classList.add('hidden');
        document.getElementById('iphone-duo-unfolded').classList.remove('hidden');
        document.getElementById('device-state-label').textContent = '📱 iPhone Duo: ඇතුළත තිර දෙක (UNFOLDED TACTICAL VIEW)';
        this.RollNewOpponent();
        this.resetCurrentPlacements();

        if (!PlayerProfile.isFullGameUnlocked && PlayerProfile.trialsLeft <= 0) {
            UI.openModal('paywall-modal');
        }
    }
};

window.addEventListener('DOMContentLoaded', () => Game.init());