import { describe, test, expect } from 'bun:test';
import { ticTacToeEngine } from './engine';

describe('TicTacToe init()', () => {
  test('init creates empty board state with correct defaults', () => {
    const state = ticTacToeEngine.init({}, ['p1', 'p2']);

    expect(state.gameType).toBe('tic-tac-toe');
    expect(state.board).toEqual(['', '', '', '', '', '', '', '', '']);
    expect(state.board).toHaveLength(9);
    expect(state.players).toHaveLength(2);
    expect(state.players[0].sessionId).toBe('p1');
    expect(state.players[0].symbol).toBe('X');
    expect(state.players[1].sessionId).toBe('p2');
    expect(state.players[1].symbol).toBe('O');
    expect(state.currentTurn).toBe('p1');
    expect(state.moveCount).toBe(0);
  });

  test('init returns immutable state (new object each call)', () => {
    const state1 = ticTacToeEngine.init({}, ['p1', 'p2']);
    const state2 = ticTacToeEngine.init({}, ['p1', 'p2']);

    expect(state1).not.toBe(state2);
    expect(state1.board).not.toBe(state2.board);
    expect(state1.players).not.toBe(state2.players);
  });
});
