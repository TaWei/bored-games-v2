/**
 * All supported game types in bored-games v2.
 * Each game type corresponds to a game engine in packages/shared/src/games/.
 *
 * This is a discriminated union — every game type must be listed here.
 */
export type GameType = 'tic-tac-toe';

/**
 * Type guard to check if a string is a valid GameType.
 */
export function isGameType(value: string): value is GameType {
  return value === 'tic-tac-toe';
}

// ─── Player & Spectator Types ──────────────────────────────

/**
 * Anonymous session metadata. sessionId is a crypto.randomUUID()
 * stored in localStorage. No accounts required.
 */
export interface SessionMetadata {
  readonly sessionId: string;
  readonly displayName: string;
  readonly createdAt: number;
}

/**
 * A player in a game room. Extends SessionMetadata with a game-specific symbol.
 */
export interface Player extends SessionMetadata {
  readonly symbol: string;
}

/**
 * A spectator watching a game. Has no symbol — cannot make moves.
 */
export type Spectator = SessionMetadata;
