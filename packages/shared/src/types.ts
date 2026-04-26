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

// ─── Room Types ────────────────────────────────────────────

/**
 * Room lifecycle status.
 */
export type RoomStatus = 'waiting' | 'in_progress' | 'finished' | 'abandoned';

/**
 * A game room. Rooms are the primary unit of game sessions.
 * All fields use readonly for immutability (Principle 3).
 */
export interface Room {
  readonly code: string;
  readonly gameType: GameType;
  readonly hostSessionId: string;
  readonly status: RoomStatus;
  readonly players: readonly Player[];
  readonly spectators: readonly Spectator[];
  readonly createdAt: number;
  readonly maxPlayers: number;
  readonly rematchRequests: readonly string[];
}

// ─── Base Game State ───────────────────────────────────────

/**
 * Common fields shared by all game states.
 * Each game engine extends this with game-specific fields.
 */
export interface BaseGameState {
  readonly gameType: GameType;
  readonly players: readonly Player[];
  readonly currentTurn: string | null;
  readonly moveCount: number;
}

// ─── Move / Error Types ────────────────────────────────────

/**
 * Error codes for invalid moves. Engine-specific codes
 * (e.g., CELL_OCCUPIED for tic-tac-toe) extend beyond these.
 */
export type MoveErrorCode =
  | 'CELL_OCCUPIED'
  | 'NOT_YOUR_TURN'
  | 'GAME_OVER'
  | 'NOT_PLAYER'
  | 'INVALID_MOVE';

/**
 * A move validation error with machine-readable code.
 */
export interface MoveError {
  readonly code: MoveErrorCode | string;
  readonly message: string;
}

/**
 * Discriminated union for move results.
 * - ok: true → move succeeded, new state returned
 * - ok: false → move rejected, error details provided
 *
 * This enables exhaustive type narrowing at call sites.
 */
export type MoveResult<S> =
  | { readonly ok: true; readonly state: S }
  | { readonly ok: false; readonly error: MoveError };

// ─── Game End Types ────────────────────────────────────────

/**
 * Reasons a game can end. Specific engines may define additional reasons.
 */
export type GameEndReason =
  | 'THREE_IN_A_ROW'
  | 'BOARD_FULL'
  | 'RESIGNATION'
  | 'TIMEOUT'
  | 'DISCONNECT';

/**
 * Terminal game result. winner is null for draws.
 */
export interface GameEnd {
  readonly winner: string | null;
  readonly reason: GameEndReason | string;
}

// ─── Game Metadata ─────────────────────────────────────────

/**
 * Human-readable metadata for a game type.
 * Returned by the game registry and used in the lobby UI.
 */
export interface GameMeta {
  readonly gameType: GameType;
  readonly name: string;
  readonly description: string;
  readonly minPlayers: number;
  readonly maxPlayers: number;
  readonly slug: string;
  readonly icon: string;
}
