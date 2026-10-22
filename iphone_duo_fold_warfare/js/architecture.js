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