#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
iPhone Duo: Tactical Fold Warfare - Automated Project Generator & Launcher
මෙම ස්ක්‍රිප්ට් එක ක්‍රියාත්මක කළ විට අවශ්‍ය සියලුම ෆෝල්ඩර සහ ගොනු ස්වයංක්‍රීයව සෑදේ.
"""

import os
import sys
import json
import webbrowser
import threading
from http.server import HTTPServer, SimpleHTTPRequestHandler

PROJECT_DIR = "iphone_duo_fold_warfare"

FOLDERS = [
    PROJECT_DIR,
    os.path.join(PROJECT_DIR, "css"),
    os.path.join(PROJECT_DIR, "js"),
    os.path.join(PROJECT_DIR, "assets"),
]

# 1. JSON Architecture Blueprint
ARCHITECTURE_JSON = {
    "game_title": "FOLD WARFARE: DUO MILITIA",
    "target_device": "iPhone Duo (Dual Inner Displays + Outer Cover Display)",
    "release_version": "1.0.0 (Level 1 Base Release + Upgrade Architecture Ready)",
    "art_style": "Mini Militia Inspired High-Quality Tactical Cartoon UI",
    "monetization": {
        "type": "Paid Game with Free Trial",
        "free_trial_matches": 3,
        "full_unlock_price_usd": 4.99,
        "in_app_purchases": ["Coins Top-Up", "Stealth Skills", "Unit Skins", "Bunker Upgrades"]
    },
    "combat_rules": {
        "fold_mapping": "Player 1 (x, y) maps to Player 2 (x, H - y) on hinge fold",
        "rps_matrix": {
            "mortar_soldier": {"beats": "heavy_tank", "multiplier": 2.5},
            "heavy_tank": {"beats": "proximity_bomb", "multiplier": 2.5},
            "proximity_bomb": {"beats": "mortar_soldier", "multiplier": 3.0}
        }
    }
}

# 2. HTML File (index.html)
INDEX_HTML = """<!DOCTYPE html>
<html lang="si">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>iPhone Duo - Tactical Fold Warfare (Mini Militia Edition)</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <!-- Top Navigation & Status Bar -->
    <header class="top-bar">
        <div class="brand-logo">
            <span class="badge-cartoon">DUO MILITIA</span>
            <h1>TACTICAL FOLD WARFARE</h1>
        </div>
        
        <div class="player-stats-bar">
            <div class="stat-pill trophy-pill" title="Clash of Clans Style Trophies">
                <span class="icon">🏆</span>
                <div>
                    <small id="league-name">BRONZE I</small>
                    <strong id="trophy-count">400</strong>
                </div>
            </div>
            <div class="stat-pill coin-pill">
                <span class="icon">🪙</span>
                <div>
                    <small>COINS</small>
                    <strong id="coin-count">250</strong>
                </div>
                <button class="btn-mini-add" onclick="UI.openModal('store-modal')">+</button>
            </div>
            <div class="stat-pill trial-pill" id="trial-badge">
                <span class="icon">🎟️</span>
                <div>
                    <small>TRIAL CHANCES</small>
                    <strong id="trial-count">3 / 3</strong>
                </div>
            </div>
        </div>

        <div class="nav-actions">
            <button class="btn-cartoon btn-green" onclick="UI.openModal('upgrade-modal')">⬆️ UPGRADES & SETS</button>
            <button class="btn-cartoon btn-orange" onclick="UI.openModal('store-modal')">🛒 SKIN & SKILL STORE</button>
            <button class="btn-cartoon btn-blue" onclick="UI.openModal('arch-modal')">📐 ARCHITECTURE</button>
        </div>
    </header>

    <!-- Main Workspace -->
    <main class="workspace">
        <!-- Left Control Panel: Mode, Turn, Skills & Deck -->
        <aside class="side-panel left-panel">
            <div class="panel-card">
                <h3>🎮 GAME MODE (ක්‍රීඩා ආකාරය)</h3>
                <div class="mode-selector">
                    <button id="mode-online" class="btn-mode active" onclick="Game.setMode('online')">🌐 ONLINE RANKED</button>
                    <button id="mode-local" class="btn-mode" onclick="Game.setMode('local')">👥 OFFLINE 2-PLAYER</button>
                </div>
                <div class="matchmaking-info" id="opponent-card">
                    <div class="opp-row">
                        <span>ප්‍රතිවාදියා (Opponent):</span>
                        <strong id="opp-name">Commander Rex</strong>
                    </div>
                    <div class="opp-row">
                        <span>ප්‍රතිවාදී Trophies:</span>
                        <strong id="opp-trophies">🏆 480</strong>
                    </div>
                    <div class="opp-row win-reward">
                        <span>ජයග්‍රහණයට ලැබෙන Trophies:</span>
                        <strong id="win-trophy-preview">+36 🏆</strong>
                    </div>
                    <button class="btn-cartoon btn-sm" onclick="Game.RollNewOpponent()">🔄 වෙනත් ප්‍රතිවාදියෙක් සොයන්න</button>
                </div>
            </div>

            <div class="panel-card">
                <h3>🕵️ SKILLS / වරම් (STEALTH & TACTICS)</h3>
                <p class="hint-text">ඒකකයක් සිතියමේ තැබීමට පෙර හෝ පසුව Skill එකක් තෝරන්න. සැඟවූ (Hidden) බෝම්බ ප්‍රතිවාදියාට නොපෙනේ!</p>
                <div class="skills-grid">
                    <button id="skill-hide" class="skill-btn" onclick="Game.toggleSkill('stealth')">
                        <span class="s-icon">👻</span>
                        <span class="s-name">Hide Unit (සඟවන්න)</span>
                        <span class="s-count" id="cnt-stealth">x2</span>
                    </button>
                    <button id="skill-radar" class="skill-btn" onclick="Game.useInstantSkill('radar')">
                        <span class="s-icon">📡</span>
                        <span class="s-name">Radar Scan (සොයන්න)</span>
                        <span class="s-count" id="cnt-radar">x1</span>
                    </button>
                    <button id="skill-shield" class="skill-btn" onclick="Game.toggleSkill('shield')">
                        <span class="s-icon">🛡️</span>
                        <span class="s-name">Bunker Shield</span>
                        <span class="s-count" id="cnt-shield">x1</span>
                    </button>
                    <button id="skill-boost" class="skill-btn" onclick="Game.toggleSkill('boost')">
                        <span class="s-icon">⚡</span>
                        <span class="s-name">Power Overcharge</span>
                        <span class="s-count" id="cnt-boost">x2</span>
                    </button>
                </div>
            </div>

            <div class="panel-card rps-guide">
                <h3>⚔️ COMBAT TRIAD (සටන් තර්කනය)</h3>
                <div class="rps-badges">
                    <div class="rps-item"><span>🪖 මෝටාර් සෙබළා</span> ➡️ <span>🚜 ටැංකිය විනාශ කරයි</span></div>
                    <div class="rps-item"><span>🚜 යුද්ධ ටැංකිය</span> ➡️ <span>💣 බෝම්බය නිෂ්ක්‍රීය කරයි</span></div>
                    <div class="rps-item"><span>💣 බෝම්බය</span> ➡️ <span>🪖 සෙබළාව විනාශ කරයි</span></div>
                    <div class="rps-item"><span>🏰 Main Bunker</span> ➡️ <span>විනාශ කළොත් ක්ෂණික ජය!</span></div>
                </div>
            </div>
        </aside>

        <!-- Center: iPhone Duo Hardware Simulator (Unfolded Dual Screen <-> Folded Outer Screen) -->
        <section class="device-stage">
            <div class="device-controls-bar">
                <span class="device-status-tag" id="device-state-label">📱 iPhone Duo: ඇතුළත තිර දෙක (UNFOLDED TACTICAL VIEW)</span>
                <div class="turn-indicator" id="turn-banner">PLAYER 1: ඔබේ ඒකක 10 සිතියමේ ස්ථානගත කරන්න</div>
            </div>

            <!-- UNFOLDED INNER DUAL SCREENS -->
            <div id="iphone-duo-unfolded" class="iphone-duo-frame">
                <!-- Inner Top Screen: Player 2 / Enemy Territory -->
                <div class="inner-screen top-screen">
                    <div class="screen-hud top-hud">
                        <span class="hud-tag enemy-tag">🔴 ENEMY SECTOR (ප්‍රතිවාදී කලාපය)</span>
                        <span class="bunker-hp-bar">🏰 Bunker HP: <strong id="p2-bunker-hp">1000/1000</strong></span>
                        <span class="placed-counter">Units: <strong id="p2-unit-count">0/10</strong></span>
                    </div>
                    <canvas id="canvas-top" width="520" height="250"></canvas>
                </div>

                <!-- Center Folding Hinge with FIGHT Button -->
                <div class="duo-hinge">
                    <div class="hinge-screw left"></div>
                    <button id="btn-fold-fight" class="btn-fight-mega" onclick="Game.triggerFoldAndFight()">
                        🔥 FOLD & FIGHT! (නවා සටන් කරන්න)
                    </button>
                    <button id="btn-switch-p2" class="btn-pass-turn hidden" onclick="Game.finishPlayer1Turn()">
                        ⏭️ PASS TO PLAYER 2
                    </button>
                    <div class="hinge-screw right"></div>
                </div>

                <!-- Inner Bottom Screen: Player 1 Territory -->
                <div class="inner-screen bottom-screen">
                    <div class="screen-hud bottom-hud">
                        <span class="hud-tag ally-tag">🔵 ALLY SECTOR (ඔබේ කලාපය)</span>
                        <span class="bunker-hp-bar">🏰 Bunker HP: <strong id="p1-bunker-hp">1000/1000</strong></span>
                        <span class="placed-counter">Units: <strong id="p1-unit-count">0/10</strong></span>
                    </div>
                    <canvas id="canvas-bottom" width="520" height="250"></canvas>
                </div>
            </div>

            <!-- FOLDED OUTER COVER DISPLAY (Battle Animation Arena) -->
            <div id="iphone-duo-folded" class="iphone-outer-frame hidden">
                <div class="outer-camera-notch">
                    <div class="cam-lens"></div>
                    <div class="cam-lens"></div>
                    <span>iPhone Duo Outer Display - LIVE COMBAT</span>
                </div>
                <div class="outer-screen-hud">
                    <div class="outer-hp ally">
                        <span>🔵 P1 BUNKER</span>
                        <div class="hp-track"><div id="outer-p1-bar" class="hp-fill" style="width:100%"></div></div>
                    </div>
                    <div class="vs-badge">⚔️</div>
                    <div class="outer-hp enemy">
                        <span>🔴 P2 BUNKER</span>
                        <div class="hp-track"><div id="outer-p2-bar" class="hp-fill" style="width:100%"></div></div>
                    </div>
                </div>
                <canvas id="canvas-outer" width="520" height="380"></canvas>
                <div id="combat-log-ticker" class="combat-ticker">දුරකථනය නැවුණා! ඛණ්ඩාංක සමපාත කරමින් සටන ආරම්භ වේ...</div>
                <div class="outer-footer-actions">
                    <button id="btn-unfold-next" class="btn-cartoon btn-green hidden" onclick="Game.unfoldForNextRound()">
                        📖 UNFOLD PHONE (නැවත දිගහරින්න)
                    </button>
                </div>
            </div>

            <!-- Bottom 10-Item Deployment Dock (යටින් ලැයිස්තුගත කර ඇති අයිටම් 10) -->
            <div class="deployment-dock">
                <div class="dock-header">
                    <span>🎒 DEPLOYMENT DECK (ඔබට හිමි අයිටම් 10 - තෝරා සිතියම මත ක්ලික් කරන්න)</span>
                    <button class="btn-clear-map" onclick="Game.resetCurrentPlacements()">🗑️ Clear Map</button>
                </div>
                <div id="unit-slots-container" class="unit-slots-row">
                    <!-- Populated dynamically by JS (10 slots) -->
                </div>
            </div>
        </section>
    </main>

    <!-- MODAL 1: Store, Coins Top-up & Skins -->
    <div id="store-modal" class="modal-overlay hidden">
        <div class="modal-box">
            <div class="modal-header">
                <h2>🛒 MILITARY STORE (COINS, SKILLS & SKINS)</h2>
                <button class="btn-close" onclick="UI.closeModal('store-modal')">✖</button>
            </div>
            <div class="modal-body">
                <h3>🪙 1. COIN TOP-UP (සැබෑ මුදලින් Coins මිලදී ගැනීම)</h3>
                <div class="store-grid">
                    <div class="store-card">
                        <div class="big-icon">🪙 500</div>
                        <h4>Recruit Pack</h4>
                        <p>මූලික Skills සහ Upgrades සඳහා</p>
                        <button class="btn-cartoon btn-green" onclick="Store.buyCoins(500, '$0.99')">Buy $0.99</button>
                    </div>
                    <div class="store-card">
                        <div class="big-icon">💰 2,000</div>
                        <h4>Commander Chest</h4>
                        <p>+25% Bonus Coins</p>
                        <button class="btn-cartoon btn-orange" onclick="Store.buyCoins(2000, '$2.99')">Buy $2.99</button>
                    </div>
                    <div class="store-card">
                        <div class="big-icon">💎 5,000</div>
                        <h4>General Vault</h4>
                        <p>සියලුම Skins සහ Upgrades සඳහා</p>
                        <button class="btn-cartoon btn-blue" onclick="Store.buyCoins(5000, '$4.99')">Buy $4.99</button>
                    </div>
                </div>

                <h3>🕵️ 2. BUY TACTICAL SKILLS (Coins මගින් වරම් මිලදී ගන්න)</h3>
                <div class="store-grid">
                    <div class="store-card">
                        <div class="big-icon">👻</div>
                        <h4>Hide / Stealth Skill (x3)</h4>
                        <p>බෝම්බ හෝ ඒකක ප්‍රතිවාදියාට නොපෙනෙන සේ සැඟවීමට</p>
                        <button class="btn-cartoon btn-green" onclick="Store.buySkill('stealth', 3, 120)">🪙 120 Coins</button>
                    </div>
                    <div class="store-card">
                        <div class="big-icon">📡</div>
                        <h4>Radar Scanner (x2)</h4>
                        <p>ප්‍රතිවාදියා සඟවා ඇති බෝම්බ හෙළිදරව් කරගැනීමට</p>
                        <button class="btn-cartoon btn-green" onclick="Store.buySkill('radar', 2, 150)">🪙 150 Coins</button>
                    </div>
                    <div class="store-card">
                        <div class="big-icon">🛡️</div>
                        <h4>Bunker Shield (x2)</h4>
                        <p>ඔබේ ප්‍රධාන බංකරයට අමතර ආරක්ෂාවක්</p>
                        <button class="btn-cartoon btn-green" onclick="Store.buySkill('shield', 2, 180)">🪙 180 Coins</button>
                    </div>
                </div>

                <h3>🎨 3. MINI MILITIA CARTOON SKIN STORE</h3>
                <div class="store-grid" id="skins-store-grid">
                    <!-- Populated by JS -->
                </div>
            </div>
        </div>
    </div>

    <!-- MODAL 2: Unit Upgrades & Deck Sets -->
    <div id="upgrade-modal" class="modal-overlay hidden">
        <div class="modal-box">
            <div class="modal-header">
                <h2>⬆️ CLASH OF CLANS STYLE UNIT UPGRADES & SETS</h2>
                <button class="btn-close" onclick="UI.closeModal('upgrade-modal')">✖</button>
            </div>
            <div class="modal-body">
                <p class="hint-text">Release 1 හි මූලිකව Level 1 ලෙස ආරම්භ වේ. ඔබේ Coins භාවිතා කර ඒකකවල HP, Attack Power සහ Attack Range වැඩිදියුණු (Level Up) කළ හැකිය.</p>
                <div class="store-grid" id="upgrade-cards-grid">
                    <!-- Populated by JS -->
                </div>
            </div>
        </div>
    </div>

    <!-- MODAL 3: 3-Trial Expired Paywall -->
    <div id="paywall-modal" class="modal-overlay hidden">
        <div class="modal-box paywall-box">
            <div class="modal-header">
                <h2>🔒 FREE TRIAL ENDED (නොමිලේ දුන් අවස්ථා 3 අවසන්!)</h2>
            </div>
            <div class="modal-body center-text">
                <div class="big-icon">🎖️</div>
                <h3>Unlock Full iPhone Duo Tactical Warfare</h3>
                <p>ඔබ නොමිලේ ලබා දුන් අත්හදා බැලීමේ තරග 3 (3 Free Trial Chances) ක්‍රීඩා කර අවසන් කර ඇත. අසීමිත Online Ranked තරග, සියලුම ඒකක 10 සහ Upgrades ලබා ගැනීමට සම්පූර්ණ ක්‍රීඩාව Unlock කරන්න!</p>
                <div class="paywall-perks">
                    <span>✅ Unlimited Matches</span>
                    <span>✅ +1,000 Bonus Coins</span>
                    <span>✅ +3 Stealth Skills</span>
                </div>
                <button class="btn-fight-mega" onclick="Store.unlockFullGame()">🔓 UNLOCK FULL GAME ($4.99)</button>
            </div>
        </div>
    </div>

    <!-- MODAL 4: System Architecture Overview -->
    <div id="arch-modal" class="modal-overlay hidden">
        <div class="modal-box">
            <div class="modal-header">
                <h2>📐 GAME ARCHITECTURE BLUEPRINT</h2>
                <button class="btn-close" onclick="UI.closeModal('arch-modal')">✖</button>
            </div>
            <div class="modal-body">
                <ul class="arch-list">
                    <li><strong>Dual-Screen Coordinate Mirroring:</strong> දුරකථනය නැවූ විට Player 1 ගේ <code>(x, y)</code> ලක්ෂ්‍යය Player 2 ගේ <code>(x, Height - y)</code> මතට පතිත වේ.</li>
                    <li><strong>Pre-Created + Real-Time Combat Animations:</strong> ටැංකි වෙඩි තැබීම්, මෝටාර් ප්‍රහාර, සහ බිම් බෝම්බ පිපිරීම් පිටත තිරයේ (Outer Display) සජීවීව ධාවනය වේ.</li>
                    <li><strong>Range & Zone Targeting:</strong> එක ස්ථානයක තැබූ ඒකකයකට තම <code>attackRange</code> කලාපය තුළ ඇති සතුරු ඒකක සහ Main Bunker එකට පහර දිය හැකිය.</li>
                    <li><strong>ELO Trophy Ranking:</strong> ප්‍රතිවාදියාගේ Trophies වැඩි නම් ජයග්‍රහණයේදී වැඩි Trophies ප්‍රමාණයක් හිමිවේ.</li>
                </ul>
            </div>
        </div>
    </div>

    <script src="js/config.js"></script>
    <script src="js/audio.js"></script>
    <script src="js/architecture.js"></script>
    <script src="js/combat_engine.js"></script>
    <script src="js/main.js"></script>
</body>
</html>
"""

# 3. CSS File (css/style.css) - Mini Militia Cartoon Military Aesthetic
STYLE_CSS = """
:root {
    --bg-dark: #1b2218;
    --panel-olive: #2b3726;
    --border-cartoon: #11160f;
    --accent-orange: #ff7b00;
    --accent-green: #58b836;
    --accent-blue: #2998ff;
    --accent-red: #e63946;
    --text-cream: #f4f1de;
    --gold: #ffd166;
}

* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    user-select: none;
    font-family: 'Trebuchet MS', 'Segoe UI', sans-serif;
}

body {
    background: radial-gradient(circle at center, #2f3e28 0%, #141a12 100%);
    color: var(--text-cream);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
}

/* Top Bar - Mini Militia Cartoon Style */
.top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 20px;
    background: #232d1e;
    border-bottom: 4px solid var(--border-cartoon);
    box-shadow: 0 4px 0 rgba(0,0,0,0.4);
}

.brand-logo {
    display: flex;
    align-items: center;
    gap: 12px;
}

.badge-cartoon {
    background: var(--accent-orange);
    color: #000;
    font-weight: 900;
    padding: 4px 10px;
    border-radius: 6px;
    border: 3px solid #000;
    box-shadow: 2px 2px 0 #000;
    font-size: 0.85rem;
}

.brand-logo h1 {
    font-size: 1.25rem;
    letter-spacing: 1px;
    text-shadow: 2px 2px 0 #000;
}

.player-stats-bar {
    display: flex;
    gap: 14px;
}

.stat-pill {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #171e14;
    padding: 5px 14px;
    border-radius: 10px;
    border: 3px solid #000;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.6), 0 3px 0 #000;
}

.stat-pill .icon {
    font-size: 1.3rem;
}

.stat-pill small {
    display: block;
    font-size: 0.65rem;
    color: #a9b8a2;
    font-weight: bold;
}

.stat-pill strong {
    font-size: 1rem;
    color: var(--gold);
}

.btn-mini-add {
    background: var(--accent-green);
    color: #000;
    font-weight: 900;
    border: 2px solid #000;
    border-radius: 5px;
    width: 24px;
    height: 24px;
    cursor: pointer;
}

.nav-actions {
    display: flex;
    gap: 10px;
}

.btn-cartoon {
    padding: 8px 14px;
    font-weight: 900;
    color: #fff;
    border: 3px solid #000;
    border-radius: 8px;
    cursor: pointer;
    text-shadow: 1px 1px 0 #000;
    box-shadow: 0 4px 0 #000;
    transition: transform 0.1s;
}

.btn-cartoon:active {
    transform: translateY(3px);
    box-shadow: 0 1px 0 #000;
}

.btn-green { background: var(--accent-green); }
.btn-orange { background: var(--accent-orange); }
.btn-blue { background: var(--accent-blue); }
.btn-sm { padding: 5px 10px; font-size: 0.8rem; width: 100%; margin-top: 6px; background: #4a5d41; }

/* Main Workspace */
.workspace {
    display: grid;
    grid-template-columns: 330px 1fr;
    gap: 18px;
    padding: 15px 20px;
    flex: 1;
}

.side-panel {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.panel-card {
    background: var(--panel-olive);
    border: 3px solid #000;
    border-radius: 12px;
    padding: 12px;
    box-shadow: 0 5px 0 rgba(0,0,0,0.45);
}

.panel-card h3 {
    font-size: 0.95rem;
    color: var(--gold);
    margin-bottom: 8px;
    text-shadow: 1px 1px 0 #000;
    border-bottom: 2px dashed rgba(255,255,255,0.15);
    padding-bottom: 5px;
}

.mode-selector {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 10px;
}

.btn-mode {
    padding: 8px;
    background: #1b2218;
    color: #b7c6b0;
    border: 2px solid #000;
    border-radius: 6px;
    font-weight: bold;
    cursor: pointer;
    font-size: 0.78rem;
}

.btn-mode.active {
    background: var(--accent-orange);
    color: #000;
    box-shadow: 0 3px 0 #000;
}

.matchmaking-info {
    background: #1d261a;
    padding: 8px 10px;
    border-radius: 8px;
    border: 2px solid #000;
    font-size: 0.83rem;
}

.opp-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
}

.win-reward strong {
    color: #6fffe9;
}

.hint-text {
    font-size: 0.78rem;
    color: #c7d6c0;
    margin-bottom: 8px;
    line-height: 1.35;
}

.skills-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
}

.skill-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: #1c2519;
    border: 2px solid #000;
    border-radius: 8px;
    padding: 8px 6px;
    color: #fff;
    cursor: pointer;
    position: relative;
    transition: all 0.15s;
}

.skill-btn.active {
    background: #6b2d5c;
    border-color: var(--gold);
    box-shadow: 0 0 10px var(--gold);
}

.skill-btn .s-icon { font-size: 1.3rem; }
.skill-btn .s-name { font-size: 0.74rem; font-weight: bold; margin-top: 3px; }
.skill-btn .s-count {
    position: absolute;
    top: 4px;
    right: 6px;
    background: var(--accent-orange);
    color: #000;
    font-size: 0.68rem;
    font-weight: 900;
    padding: 1px 5px;
    border-radius: 4px;
}

.rps-badges {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 0.8rem;
}

.rps-item {
    display: flex;
    justify-content: space-between;
    background: #1d261a;
    padding: 6px 8px;
    border-radius: 6px;
    border: 1px solid #000;
}

/* Center iPhone Duo Hardware Stage */
.device-stage {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
}

.device-controls-bar {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #232d1e;
    border: 3px solid #000;
    border-radius: 10px;
    padding: 8px 14px;
    margin-bottom: 8px;
}

.device-status-tag {
    font-weight: 900;
    color: var(--gold);
    font-size: 0.9rem;
}

.turn-indicator {
    background: var(--accent-blue);
    color: #000;
    font-weight: 900;
    padding: 4px 12px;
    border-radius: 6px;
    border: 2px solid #000;
    font-size: 0.82rem;
}

/* iPhone Duo Unfolded Frame */
.iphone-duo-frame {
    background: #101314;
    border: 6px solid #353b3c;
    border-radius: 26px;
    padding: 10px;
    box-shadow: 0 14px 30px rgba(0,0,0,0.7), inset 0 0 10px #000;
    display: flex;
    flex-direction: column;
    align-items: center;
    transition: transform 0.5s ease;
}

.inner-screen {
    background: #24301f;
    border: 3px solid #000;
    border-radius: 14px;
    overflow: hidden;
    position: relative;
}

.screen-hud {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 12px;
    background: rgba(0,0,0,0.75);
    font-size: 0.78rem;
    border-bottom: 2px solid #000;
}

.enemy-tag { color: #ff6b6b; font-weight: 900; }
.ally-tag { color: #4cc9f0; font-weight: 900; }

canvas {
    display: block;
    cursor: crosshair;
}

/* Hinge in the middle of the two screens */
.duo-hinge {
    width: 100%;
    height: 44px;
    background: linear-gradient(180deg, #1a1d1a 0%, #343a34 50%, #1a1d1a 100%);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 14px;
    margin: 4px 0;
    border-radius: 8px;
    border: 2px solid #000;
}

.hinge-screw {
    width: 14px;
    height: 14px;
    background: #555;
    border-radius: 50%;
    border: 2px solid #111;
}

.btn-fight-mega {
    background: linear-gradient(180deg, #ff9900 0%, #e63946 100%);
    color: #fff;
    font-weight: 900;
    font-size: 0.95rem;
    padding: 6px 24px;
    border: 3px solid #000;
    border-radius: 20px;
    cursor: pointer;
    text-shadow: 1px 2px 0 #000;
    box-shadow: 0 4px 0 #000;
    animation: pulseFight 1.5s infinite;
}

@keyframes pulseFight {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.04); }
}

.btn-pass-turn {
    background: var(--accent-blue);
    color: #000;
    font-weight: 900;
    padding: 6px 16px;
    border: 3px solid #000;
    border-radius: 16px;
    cursor: pointer;
}

/* Folded Outer Screen */
.iphone-outer-frame {
    background: #121517;
    border: 8px solid #495057;
    border-radius: 30px;
    padding: 14px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.85);
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 560px;
}

.outer-camera-notch {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    font-size: 0.8rem;
    color: var(--gold);
    font-weight: bold;
}

.cam-lens {
    width: 16px;
    height: 16px;
    background: radial-gradient(circle, #2998ff 20%, #000 80%);
    border-radius: 50%;
    border: 2px solid #666;
}

.outer-screen-hud {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #1b2218;
    padding: 6px 12px;
    border: 2px solid #000;
    border-radius: 8px;
    margin-bottom: 6px;
}

.outer-hp {
    width: 42%;
    font-size: 0.75rem;
    font-weight: 900;
}

.hp-track {
    width: 100%;
    height: 10px;
    background: #000;
    border-radius: 5px;
    overflow: hidden;
    margin-top: 3px;
}

.ally .hp-fill { background: #4cc9f0; height: 100%; transition: width 0.25s; }
.enemy .hp-fill { background: #ff4d6d; height: 100%; transition: width 0.25s; }

.combat-ticker {
    width: 100%;
    background: #000;
    color: var(--gold);
    font-size: 0.85rem;
    font-weight: bold;
    padding: 8px 12px;
    border-radius: 6px;
    margin-top: 8px;
    text-align: center;
    border: 2px solid #333;
}

.outer-footer-actions {
    margin-top: 10px;
}

/* Bottom 10-Item Deployment Dock */
.deployment-dock {
    width: 100%;
    background: var(--panel-olive);
    border: 3px solid #000;
    border-radius: 12px;
    padding: 8px 12px;
    margin-top: 8px;
    box-shadow: 0 5px 0 rgba(0,0,0,0.5);
}

.dock-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.8rem;
    font-weight: 900;
    color: var(--gold);
    margin-bottom: 6px;
}

.btn-clear-map {
    background: var(--accent-red);
    color: #fff;
    border: 2px solid #000;
    border-radius: 5px;
    padding: 2px 8px;
    font-size: 0.75rem;
    font-weight: bold;
    cursor: pointer;
}

.unit-slots-row {
    display: grid;
    grid-template-columns: repeat(10, 1fr);
    gap: 6px;
}

.unit-slot {
    background: #1a2216;
    border: 3px solid #000;
    border-radius: 8px;
    padding: 6px 4px;
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    position: relative;
    transition: transform 0.12s;
}

.unit-slot:hover {
    transform: translateY(-3px);
}

.unit-slot.selected {
    background: #384f2f;
    border-color: var(--gold);
    box-shadow: 0 0 8px var(--gold);
}

.unit-slot.deployed {
    opacity: 0.35;
    pointer-events: none;
    filter: grayscale(1);
}

.unit-slot .u-emoji { font-size: 1.4rem; }
.unit-slot .u-title { font-size: 0.65rem; font-weight: bold; text-align: center; margin-top: 2px; }
.unit-slot .u-lvl {
    position: absolute;
    top: 2px;
    left: 4px;
    font-size: 0.6rem;
    color: var(--gold);
    font-weight: 900;
}

/* Modals */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
}

.modal-box {
    background: var(--panel-olive);
    border: 4px solid #000;
    border-radius: 16px;
    width: 90%;
    max-width: 760px;
    max-height: 85vh;
    overflow-y: auto;
    box-shadow: 0 12px 0 #000;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 18px;
    background: #1d261a;
    border-bottom: 3px solid #000;
}

.btn-close {
    background: var(--accent-red);
    color: #fff;
    border: 2px solid #000;
    border-radius: 6px;
    width: 30px;
    height: 30px;
    font-weight: 900;
    cursor: pointer;
}

.modal-body {
    padding: 16px 18px;
}

.modal-body h3 {
    color: var(--gold);
    margin: 12px 0 8px;
    font-size: 0.95rem;
}

.store-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
}

.store-card {
    background: #1b2218;
    border: 3px solid #000;
    border-radius: 10px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 6px;
}

.big-icon {
    font-size: 2rem;
}

.store-card p {
    font-size: 0.75rem;
    color: #b7c6b0;
}

.center-text {
    text-align: center;
}

.paywall-perks {
    display: flex;
    justify-content: center;
    gap: 15px;
    margin: 14px 0;
    font-weight: bold;
    color: var(--gold);
}

.arch-list {
    padding-left: 20px;
    line-height: 1.7;
    font-size: 0.9rem;
}

.hidden {
    display: none !important;
}
"""

# 4. JS Config File (js/config.js)
CONFIG_JS = """
// Game Configuration: Units, 10-Item Deck, RPS Matrix, Skins, and Leagues

const UNIT_CATALOG = {
    tank: {
        id: 'tank',
        name: 'යුද්ධ ටැංකිය (Tank)',
        shortName: 'Tank',
        emoji: '🚜',
        baseHp: 260,
        baseAtk: 95,
        attackRange: 95,   // Can attack nearby points within this radius after winning overlap
        beats: 'bomb',     // Tank crushes/defuses Bomb
        weakTo: 'mortar',
        color: '#4ea8de'
    },
    mortar: {
        id: 'mortar',
        name: 'මෝටාර් සෙබළා (Mortar)',
        shortName: 'Mortar',
        emoji: '🪖',
        baseHp: 180,
        baseAtk: 110,
        attackRange: 135,  // High lobbing range
        beats: 'tank',     // Mortar shells destroy Tank top armor
        weakTo: 'bomb',
        color: '#52b788'
    },
    bomb: {
        id: 'bomb',
        name: 'බෝම්බය (Mine Bomb)',
        shortName: 'Bomb',
        emoji: '💣',
        baseHp: 120,
        baseAtk: 220,
        attackRange: 65,   // Proximity blast radius
        beats: 'mortar',   // Blows up infantry/mortar soldiers
        weakTo: 'tank',
        color: '#e63946'
    },
    rocket: {
        id: 'rocket',
        name: 'රොකට් ලෝන්චරය (Rocket)',
        shortName: 'Rocket',
        emoji: '🚀',
        baseHp: 150,
        baseAtk: 130,
        attackRange: 150,  // Long range bunker siege unit
        beats: 'mortar',
        weakTo: 'tank',
        color: '#f77f00'
    }
};

// Default 10-Item Deck given to each player at the start of every round
// (3 Tanks, 3 Mortars, 3 Bombs, 1 Rocket Artillery = 10 items)
const DEFAULT_10_DECK = [
    'tank', 'tank', 'tank',
    'mortar', 'mortar', 'mortar',
    'bomb', 'bomb', 'bomb',
    'rocket'
];

const SKIN_CATALOG = [
    { id: 'default', name: 'Classic Mini Olive', cost: 0, primary: '#2d3a24', grid: '#3c4d30' },
    { id: 'desert', name: 'Desert Storm Camo', cost: 200, primary: '#6c584c', grid: '#a98467' },
    { id: 'cyber', name: 'Cyber Neon Ops', cost: 350, primary: '#10002b', grid: '#3c096c' },
    { id: 'arctic', name: 'Arctic Frost', cost: 300, primary: '#1d3557', grid: '#457b9d' }
];

const LEAGUES = [
    { name: 'BRONZE I', min: 0 },
    { name: 'SILVER II', min: 500 },
    { name: 'GOLD I', min: 800 },
    { name: 'CRYSTAL MASTERS', min: 1200 },
    { name: 'CHAMPION LEAGUE', min: 1600 },
    { name: 'LEGENDARY DUO', min: 2000 }
];
"""

# 5. JS Web Audio Synthesizer (js/audio.js)
AUDIO_JS = """
// Web Audio API Sound Effects (No external MP3 required - works 100% offline)

const SoundFX = {
    ctx: null,

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
        }
    },

    playPlace(isHidden = false) {
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = isHidden ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(isHidden ? 620 : 320, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(isHidden ? 880 : 160, this.ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.12);
    },

    playFold() {
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(420, this.ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.35);
    },

    playExplosion() {
        this.init();
        const bufferSize = this.ctx.sampleRate * 0.35;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(380, this.ctx.currentTime);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start();
    },

    playVictory() {
        this.init();
        const notes = [261.6, 329.6, 392.0, 523.2];
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.11);
            gain.gain.setValueAtTime(0.18, this.ctx.currentTime + idx * 0.11);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + idx * 0.11 + 0.2);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(this.ctx.currentTime + idx * 0.11);
            osc.stop(this.ctx.currentTime + idx * 0.11 + 0.2);
        });
    }
};
"""

# 6. JS Architecture State, Store, Upgrades & Ranking (js/architecture.js)
ARCHITECTURE_JS = """
// Player Profile, Trial System, Upgrades, Store & Clash of Clans Trophy System

const PlayerProfile = {
    trophies: 400,
    coins: 300,
    trialsLeft: 3,
    isFullGameUnlocked: false,
    equippedSkin: 'default',
    unlockedSkins: ['default'],
    skills: {
        stealth: 2,
        radar: 1,
        shield: 1,
        boost: 2
    },
    unitLevels: {
        tank: 1,
        mortar: 1,
        bomb: 1,
        rocket: 1,
        bunker: 1
    },

    getLeagueName() {
        let current = LEAGUES[0].name;
        for (const lg of LEAGUES) {
            if (this.trophies >= lg.min) current = lg.name;
        }
        return current;
    },

    // Clash of Clans style ELO Trophy calculation
    calculateTrophyDelta(opponentTrophies, isWin) {
        const diff = opponentTrophies - this.trophies;
        const factor = Math.max(0.4, Math.min(2.0, 1 + diff / 400));
        if (isWin) {
            return Math.round(30 * factor);
        } else {
            return -Math.round(20 / factor);
        }
    }
};

const Store = {
    buyCoins(amount, priceLabel) {
        PlayerProfile.coins += amount;
        SoundFX.playVictory();
        UI.syncHeader();
        alert(`✅ සාර්ථකයි! ${priceLabel} ගෙවා Coins ${amount} ක් Top-up කරන ලදී.`);
    },

    buySkill(skillKey, count, cost) {
        if (PlayerProfile.coins < cost) {
            alert('❌ ප්‍රමාණවත් Coins නොමැත! කරුණාකර Coins Top-up කරන්න.');
            return;
        }
        PlayerProfile.coins -= cost;
        PlayerProfile.skills[skillKey] += count;
        SoundFX.playPlace(true);
        UI.syncHeader();
        UI.syncSkills();
    },

    buyOrEquipSkin(skinId) {
        const skin = SKIN_CATALOG.find(s => s.id === skinId);
        if (!skin) return;

        if (!PlayerProfile.unlockedSkins.includes(skinId)) {
            if (PlayerProfile.coins < skin.cost) {
                alert('❌ මෙම Skin එක මිලදී ගැනීමට Coins ප්‍රමාණවත් නැත!');
                return;
            }
            PlayerProfile.coins -= skin.cost;
            PlayerProfile.unlockedSkins.push(skinId);
        }
        PlayerProfile.equippedSkin = skinId;
        SoundFX.playPlace();
        UI.syncHeader();
        UI.renderSkinStore();
        Game.renderInnerScreens();
    },

    upgradeUnit(unitKey) {
        const currentLvl = PlayerProfile.unitLevels[unitKey];
        if (currentLvl >= 5) {
            alert('🎖️ උපරිම Level 5 වෙත ලඟා වී ඇත!');
            return;
        }
        const cost = currentLvl * 150;
        if (PlayerProfile.coins < cost) {
            alert(`❌ Level Up කිරීමට Coins ${cost} ක් අවශ්‍යයි!`);
            return;
        }
        PlayerProfile.coins -= cost;
        PlayerProfile.unitLevels[unitKey]++;
        SoundFX.playVictory();
        UI.syncHeader();
        UI.renderUpgrades();
        Game.renderDeckDock();
    },

    unlockFullGame() {
        PlayerProfile.isFullGameUnlocked = true;
        PlayerProfile.coins += 1000;
        PlayerProfile.skills.stealth += 3;
        SoundFX.playVictory();
        UI.closeModal('paywall-modal');
        UI.syncHeader();
        UI.syncSkills();
        alert('🎉 සුබ පැතුම්! සම්පූර්ණ ක්‍රීඩාව Unlock විය (+1000 Coins & +3 Stealth Skills)!');
    }
};
"""

# 7. JS Combat Engine & Outer Screen Animation Renderer (js/combat_engine.js)
COMBAT_ENGINE_JS = """
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
"""

# 8. JS Main Controller (js/main.js)
MAIN_JS = """
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
"""

# 9. Standalone Server Runner Script (run_server.py)
RUN_SERVER_PY = """#!/usr/bin/env python3
import os
import webbrowser
from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT = 8080

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    server = HTTPServer(("127.0.0.1", PORT), SimpleHTTPRequestHandler)
    url = f"http://127.0.0.1:{PORT}/index.html"
    print(f"🚀 iPhone Duo Tactical Fold Warfare Server Running at: {url}")
    webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\\n🛑 Server stopped.")
"""

def build_project():
    print("🛠️ iPhone Duo: Tactical Fold Warfare - ෆෝල්ඩර සහ ගොනු ස්වයංක්‍රීයව නිර්මාණය වෙමින් පවතී...")
    for folder in FOLDERS:
        os.makedirs(folder, exist_ok=True)
        print(f"  📁 Created folder: {folder}")

    files_to_write = {
        os.path.join(PROJECT_DIR, "assets", "game_architecture.json"): json.dumps(ARCHITECTURE_JSON, indent=4, ensure_ascii=False),
        os.path.join(PROJECT_DIR, "index.html"): INDEX_HTML.strip(),
        os.path.join(PROJECT_DIR, "css", "style.css"): STYLE_CSS.strip(),
        os.path.join(PROJECT_DIR, "js", "config.js"): CONFIG_JS.strip(),
        os.path.join(PROJECT_DIR, "js", "audio.js"): AUDIO_JS.strip(),
        os.path.join(PROJECT_DIR, "js", "architecture.js"): ARCHITECTURE_JS.strip(),
        os.path.join(PROJECT_DIR, "js", "combat_engine.js"): COMBAT_ENGINE_JS.strip(),
        os.path.join(PROJECT_DIR, "js", "main.js"): MAIN_JS.strip(),
        os.path.join(PROJECT_DIR, "run_server.py"): RUN_SERVER_PY.strip(),
    }

    for path, content in files_to_write.items():
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"  ✅ Created file: {path}")

    print("\n🎉 සියලුම ෆෝල්ඩර සහ ගොනු සාර්ථකව නිර්මාණය කරන ලදී!")
    print(f"📂 Project Folder: ./{PROJECT_DIR}/")

    # Automatically launch local server and open the game in browser
    port = 8085
    os.chdir(PROJECT_DIR)
    server = HTTPServer(("127.0.0.1", port), SimpleHTTPRequestHandler)
    url = f"http://127.0.0.1:{port}/index.html"
    print(f"🌐 ක්‍රීඩාව Browser එකෙහි විවෘත වෙමින් පවතී: {url}")
    print("   (Server එක නැවැත්වීමට Ctrl+C ඔබන්න)")
    threading.Timer(0.8, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server නතර කරන ලදී.")

if __name__ == "__main__":
    build_project()