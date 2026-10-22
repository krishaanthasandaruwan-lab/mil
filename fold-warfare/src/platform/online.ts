import type { MatchState } from '../core/match';
import type { Side } from '../core/types';
import type { GcMatch } from './native';

/** Game Center stores turn data as bytes; the game state travels as UTF-8 JSON in base64. */
export const encodeState = (state: MatchState): string => {
  const bytes = new TextEncoder().encode(JSON.stringify(state));
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
};

export const decodeState = (base64: string): MatchState | undefined => {
  if (!base64) return undefined;
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes)) as MatchState;
};

/** The player who created the match plays P1 (bottom on their phone); the invited player plays P2. */
export const localSideOf = (match: GcMatch): Side => (match.localIndex === 1 ? 'P2' : 'P1');

export const opponentAlias = (match: GcMatch): string => {
  const other = match.participants[match.localIndex === 1 ? 0 : 1];
  return other?.alias || 'Waiting for opponent';
};

const REWARDED_KEY = 'fold-warfare/online-rewarded/v1';

/** Online battles can be replayed by both players; trophies and coins are only granted once per match. */
export const markRewarded = (matchId: string): boolean => {
  try {
    const done = new Set<string>(JSON.parse(localStorage.getItem(REWARDED_KEY) ?? '[]') as string[]);
    if (done.has(matchId)) return false;
    done.add(matchId);
    localStorage.setItem(REWARDED_KEY, JSON.stringify([...done].slice(-200)));
    return true;
  } catch {
    return true;
  }
};
