import { leagueFor, type Profile } from './profile';

/**
 * Offline season leaderboard: a fixed, seeded field of rival commanders ranked with the player by trophies.
 * It is honest about being offline (see the Privacy Policy); online rankings replace it in a later phase.
 */

export type RankEntry = { rank: number; name: string; trophies: number; avatar: string; league: string; isPlayer: boolean };

const CALLSIGNS = [
  'Iron Hawk', 'Nova', 'Raptor', 'Ghost Six', 'Valkyrie', 'Steel Rain', 'Havoc', 'Onyx', 'Blackjack', 'Sabre',
  'Titan', 'Wraith', 'Cobalt', 'Maverick', 'Phoenix', 'Echo One', 'Granite', 'Vortex', 'Talon', 'Reaper',
  'Spartan', 'Bolt', 'Kestrel', 'Bulwark', 'Nomad', 'Striker', 'Orion', 'Hammer', 'Specter', 'Falcon',
  'Rook', 'Atlas', 'Cyclone', 'Banshee', 'Jackal', 'Tempest', 'Warden', 'Viper Two', 'Sentinel', 'Comet',
  'Arrow', 'Breaker', 'Drake', 'Fury', 'Glacier', 'Hunter', 'Ion', 'Javelin', 'Kodiak', 'Lynx',
];
const AVATARS = ['avatar_viper', 'avatar_blitz', 'avatar_kobra', 'avatar_boomer', 'avatar_bruno', 'avatar_mango', 'avatar_fizz'];

const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

export const SEASON = 1;

export const rivals = (season = SEASON): Omit<RankEntry, 'rank' | 'isPlayer'>[] => {
  const rng = seeded(9000 + season);
  return CALLSIGNS.map((name, i) => {
    // Steep at the top, long tail at the bottom — like a real ladder.
    const t = i / CALLSIGNS.length;
    const trophies = Math.round(3300 * Math.pow(1 - t, 1.6) + rng() * 90);
    return { name, trophies, avatar: AVATARS[Math.floor(rng() * AVATARS.length)] ?? 'avatar_viper', league: leagueFor(trophies).name };
  });
};

export const rankings = (profile: Profile, playerAvatar: string): RankEntry[] => {
  const field = [
    ...rivals().map((r) => ({ ...r, isPlayer: false })),
    { name: profile.name, trophies: profile.trophies, avatar: playerAvatar, league: leagueFor(profile.trophies).name, isPlayer: true },
  ];
  return field
    .sort((a, b) => b.trophies - a.trophies || Number(b.isPlayer) - Number(a.isPlayer))
    .map((entry, i) => ({ ...entry, rank: i + 1 }));
};
