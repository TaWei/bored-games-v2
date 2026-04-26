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

  reduce(state: TicTacToeState, event: TicTacToeEvent): Result<TicTacToeState, string> {
    // 1. Check if game is already over
    if (ticTacToeEngine.checkEnd(state) !== null) {
      return { ok: false, error: 'GAME_OVER' };
    }

    // 2. Check if it's the player's turn
    if (state.currentTurn !== event.playerId) {
      return { ok: false, error: 'NOT_YOUR_TURN' };
    }

    // 3. Check if cell is occupied
    if (state.board[event.cell] !== '') {
      return { ok: false, error: 'CELL_OCCUPIED' };
    }

    // Find the player's symbol
    const player = state.players.find((p) => p.sessionId === event.playerId);
    const symbol = player?.symbol ?? '?';

    // Create new board with the piece placed
    const newBoard = [...state.board];
    newBoard[event.cell] = symbol;

    // Toggle turn
    const nextPlayer = state.players.find((p) => p.sessionId !== event.playerId);

    return {
      ok: true,
      value: {
        gameType: state.gameType,
        players: state.players,
        currentTurn: nextPlayer?.sessionId ?? null,
        moveCount: state.moveCount + 1,
        board: newBoard,
      },
    };
  },

  legalEvents(state: TicTacToeState, playerId: string): readonly TicTacToeEvent[] {
    if (state.currentTurn !== playerId) {
      return [];
    }
    const events: TicTacToeEvent[] = [];
    for (let cell = 0; cell < 9; cell++) {
      if (state.board[cell] === '') {
        events.push({ type: 'PIECE_PLACED', cell, playerId });
      }
    }
    return events;
  },

  checkEnd(state: TicTacToeState) {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6],             // diagonals
    ];

    for (const [a, b, c] of lines) {
      if (state.board[a] !== '' && state.board[a] === state.board[b] && state.board[b] === state.board[c]) {
        // Find the player with this symbol
        const winningSymbol = state.board[a];
        const winner = state.players.find((p) => p.symbol === winningSymbol);
        return {
          winner: winner?.sessionId ?? null,
          reason: 'THREE_IN_A_ROW',
        };
      }
    }

    // Check for draw (full board)
    if (state.board.every((cell) => cell !== '')) {
      return { winner: null, reason: 'BOARD_FULL' };
    }

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
