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