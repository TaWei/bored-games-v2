import type { GameEngine } from '../types';
import type {
  TicTacToeState,
  TicTacToeConfig,
  TicTacToeEvent,
  TicTacToeView,
} from './types';

const SYMBOLS = ['X', 'O'] as const;

/**
 * Tic-Tac-Toe game engine following the pure, event-sourced GameEngine interface.
 *
 * Board layout (flat 9-element array):
 *   0 | 1 | 2
 *   --+---+--
 *   3 | 4 | 5
 *   --+---+--
 *   6 | 7 | 8
 */
export const ticTacToeEngine: GameEngine<
  TicTacToeState,
  TicTacToeConfig,
  TicTacToeEvent,
  TicTacToeView
> = {
  gameType: 'tic-tac-toe',

  playerCount: { min: 2, max: 2 },

  meta: {
    gameType: 'tic-tac-toe',
    name: 'Tic-Tac-Toe',
    description: 'The classic 3×3 grid game. Get three in a row!',
    minPlayers: 2,
    maxPlayers: 2,
    slug: 'tic-tac-toe',
    icon: '🎯',
  },

  init(config: TicTacToeConfig, playerIds: readonly string[]): TicTacToeState {
    return {
      gameType: 'tic-tac-toe',
      players: playerIds.map((id, i) => ({
        sessionId: id,
        displayName: `Player ${i + 1}`,
        createdAt: Date.now(),
        symbol: SYMBOLS[i] ?? '?',
      })),
      currentTurn: playerIds[0] ?? null,
      moveCount: 0,
      board: ['', '', '', '', '', '', '', '', ''],
    };
  },

  reduce(state: TicTacToeState, _event: TicTacToeEvent) {
    // Stub — implemented in JER-50
    return { ok: true, value: state };
  },

  legalEvents(_state: TicTacToeState, _playerId: string) {
    // Stub — implemented in JER-48
    return [];
  },

  checkEnd(_state: TicTacToeState) {
    // Stub — implemented in JER-52
    return null;
  },

  view(state: TicTacToeState, _playerId: string): TicTacToeView {
    return {
      gameType: state.gameType,
      players: state.players,
      currentTurn: state.currentTurn,
      moveCount: state.moveCount,
      board: state.board,
    };
  },
};
