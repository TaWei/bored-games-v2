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

// ─── JER-48: legalEvents() — empty cells ────────────────────

describe('TicTacToe legalEvents()', () => {
  const freshState = ticTacToeEngine.init({}, ['p1', 'p2']);

  test('empty board returns 9 PIECE_PLACED events for current player', () => {
    const events = ticTacToeEngine.legalEvents(freshState, 'p1');
    expect(events).toHaveLength(9);

    const cells = new Set(events.map((e) => e.cell));
    // Should cover all cells 0-8
    for (let i = 0; i < 9; i++) {
      expect(cells.has(i)).toBe(true);
    }

    // All events should have correct shape
    for (const event of events) {
      expect(event.type).toBe('PIECE_PLACED');
      expect(event.playerId).toBe('p1');
      expect(event.cell).toBeGreaterThanOrEqual(0);
      expect(event.cell).toBeLessThan(9);
    }
  });

  test('non-current player gets 0 legal events on empty board', () => {
    const events = ticTacToeEngine.legalEvents(freshState, 'p2');
    expect(events).toHaveLength(0);
  });
});
