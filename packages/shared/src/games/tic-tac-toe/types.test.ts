import { describe, test, expect } from 'bun:test';
import type { TicTacToeState, TicTacToeConfig, TicTacToeEvent, TicTacToeView } from './types';

describe('TicTacToeState', () => {
  test('has 3×3 board, players, turn, moveCount', () => {
    const state: TicTacToeState = {
      gameType: 'tic-tac-toe',
      players: [
        { sessionId: 'p1', displayName: 'Alice', createdAt: 0, symbol: 'X' },
        { sessionId: 'p2', displayName: 'Bob', createdAt: 0, symbol: 'O' },
      ],
      currentTurn: 'p1',
      moveCount: 0,
      board: ['', '', '', '', '', '', '', '', ''],
    };

    expect(state.board).toHaveLength(9);
    expect(state.board[0]).toBe('');
    expect(state.currentTurn).toBe('p1');
    expect(state.moveCount).toBe(0);
    expect(state.players).toHaveLength(2);
  });

  test('extends BaseGameState (has gameType, players, currentTurn, moveCount)', () => {
    const state: TicTacToeState = {
      gameType: 'tic-tac-toe',
      players: [],
      currentTurn: null,
      moveCount: 5,
      board: ['X', 'O', 'X', 'O', 'X', 'O', '', '', ''],
    };

    expect(state.gameType).toBe('tic-tac-toe');
    expect(state.moveCount).toBe(5);
    expect(state.currentTurn).toBeNull();
  });
});

describe('TicTacToeConfig', () => {
  test('is an empty object (no config needed)', () => {
    const config: TicTacToeConfig = {};
    expect(config).toEqual({});
  });
});

describe('TicTacToeEvent', () => {
  test('PIECE_PLACED event has cell and playerId', () => {
    const event: TicTacToeEvent = {
      type: 'PIECE_PLACED',
      cell: 4,
      playerId: 'p1',
    };

    expect(event.type).toBe('PIECE_PLACED');
    expect(event.cell).toBe(4);
    expect(event.playerId).toBe('p1');
  });
});

describe('TicTacToeView', () => {
  test('view is same as state (perfect information game)', () => {
    const view: TicTacToeView = {
      gameType: 'tic-tac-toe',
      players: [],
      currentTurn: 'p1',
      moveCount: 3,
      board: ['X', '', '', '', 'O', '', '', '', ''],
    };

    expect(view.board).toHaveLength(9);
    expect(view.board[0]).toBe('X');
    expect(view.board[4]).toBe('O');
  });
});
