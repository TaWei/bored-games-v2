import type { GameType, Player } from '../../types';

/**
 * Tic-Tac-Toe game state.
 *
 * Extends the conceptual BaseGameState interface (gameType, players,
 * currentTurn, moveCount) and adds a 3×3 board represented as a flat
 * 9-element array where indices 0-8 map to:
 *
 *   0 | 1 | 2
 *   --+---+--
 *   3 | 4 | 5
 *   --+---+--
 *   6 | 7 | 8
 *
 * Each cell is '' (empty), 'X', or 'O'.
 */
export interface TicTacToeState {
  readonly gameType: GameType;
  readonly players: readonly Player[];
  readonly currentTurn: string | null;
  readonly moveCount: number;
  readonly board: readonly string[];
}

/**
 * Tic-Tac-Toe configuration — no parameters needed.
 * The board is always 3×3 for standard tic-tac-toe.
 */
export type TicTacToeConfig = Record<string, never>;

/**
 * All legal event types for tic-tac-toe.
 * Currently only PIECE_PLACED — placing a piece on the board.
 */
export type TicTacToeEvent = {
  readonly type: 'PIECE_PLACED';
  readonly cell: number;
  readonly playerId: string;
};

/**
 * What a player sees of the game state.
 * Tic-tac-toe is perfect-information, so the view is identical to state.
 */
export interface TicTacToeView {
  readonly gameType: GameType;
  readonly players: readonly Player[];
  readonly currentTurn: string | null;
  readonly moveCount: number;
  readonly board: readonly string[];
}
