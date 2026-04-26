import { describe, test, expect } from 'bun:test';
import { ticTacToeEngine } from './engine';
import type { TicTacToeState } from './types';

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
    for (let i = 0; i < 9; i++) {
      expect(cells.has(i)).toBe(true);
    }

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

// ─── JER-49: legalEvents() — occupied + wrong turn ───────────

describe('TicTacToe legalEvents() — mid-game', () => {
  // Manual state: p1 placed at cell 4, now p2's turn
  const afterOneMove: TicTacToeState = {
    gameType: 'tic-tac-toe',
    players: [
      { sessionId: 'p1', displayName: 'Alice', createdAt: 0, symbol: 'X' },
      { sessionId: 'p2', displayName: 'Bob', createdAt: 0, symbol: 'O' },
    ],
    currentTurn: 'p2',
    moveCount: 1,
    board: ['', '', '', '', 'X', '', '', '', ''],
  };

  test('occupied cell is excluded from legal events', () => {
    const events = ticTacToeEngine.legalEvents(afterOneMove, 'p2');
    expect(events).toHaveLength(8);

    const cells = new Set(events.map((e) => e.cell));
    expect(cells.has(4)).toBe(false); // Cell 4 is occupied by X
    for (let i = 0; i < 9; i++) {
      if (i !== 4) {
        expect(cells.has(i)).toBe(true);
      }
    }
  });

  test('wrong turn player gets 0 legal events', () => {
    // p1 already moved, it's p2's turn now
    const events = ticTacToeEngine.legalEvents(afterOneMove, 'p1');
    expect(events).toHaveLength(0);
  });

  // State with multiple occupied cells
  const midGame: TicTacToeState = {
    gameType: 'tic-tac-toe',
    players: [
      { sessionId: 'p1', displayName: 'Alice', createdAt: 0, symbol: 'X' },
      { sessionId: 'p2', displayName: 'Bob', createdAt: 0, symbol: 'O' },
    ],
    currentTurn: 'p1',
    moveCount: 4,
    board: ['X', 'O', '', '', 'X', '', '', '', 'O'],
  };

  test('multiple occupied cells excluded correctly', () => {
    const events = ticTacToeEngine.legalEvents(midGame, 'p1');
      expect(events).toHaveLength(5);

    const cells = new Set(events.map((e) => e.cell));
    expect(cells.has(0)).toBe(false); // X
    expect(cells.has(1)).toBe(false); // O
    expect(cells.has(4)).toBe(false); // X
    expect(cells.has(8)).toBe(false); // O
  });
});

// ─── JER-50: reduce() — valid moves ─────────────────────────

describe('TicTacToe reduce()', () => {
  const fresh = ticTacToeEngine.init({}, ['p1', 'p2']);

  test('valid move places piece and advances turn', () => {
    const result = ticTacToeEngine.reduce(fresh, {
      type: 'PIECE_PLACED',
      cell: 4,
      playerId: 'p1',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Expected ok');

    const state = result.value;
    expect(state.board[4]).toBe('X');
    expect(state.currentTurn).toBe('p2');
    expect(state.moveCount).toBe(1);
  });

  test('reduce returns new objects (immutable)', () => {
    const result = ticTacToeEngine.reduce(fresh, {
      type: 'PIECE_PLACED',
      cell: 0,
      playerId: 'p1',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Expected ok');

    const state = result.value;
    expect(state).not.toBe(fresh);
    expect(state.board).not.toBe(fresh.board);
    expect(fresh.board[0]).toBe('');
    expect(state.board[0]).toBe('X');
  });

  test('p2 can place after p1', () => {
    const r1 = ticTacToeEngine.reduce(fresh, {
      type: 'PIECE_PLACED', cell: 0, playerId: 'p1',
    });
    expect(r1.ok).toBe(true);
    if (!r1.ok) throw new Error('Expected ok');

    const r2 = ticTacToeEngine.reduce(r1.value, {
      type: 'PIECE_PLACED', cell: 8, playerId: 'p2',
    });
    expect(r2.ok).toBe(true);
    if (!r2.ok) throw new Error('Expected ok');

    expect(r2.value.board[0]).toBe('X');
    expect(r2.value.board[8]).toBe('O');
    expect(r2.value.currentTurn).toBe('p1');
    expect(r2.value.moveCount).toBe(2);
  });

  test('reduce with correct player (p1=X)', () => {
    const r = ticTacToeEngine.reduce(fresh, {
      type: 'PIECE_PLACED', cell: 6, playerId: 'p1',
    });
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error('Expected ok');
    expect(r.value.board[6]).toBe('X');
  });

  test('reduce with correct player (p2=O)', () => {
    const r1 = ticTacToeEngine.reduce(fresh, {
      type: 'PIECE_PLACED', cell: 0, playerId: 'p1',
    });
    expect(r1.ok).toBe(true);
    if (!r1.ok) throw new Error('Expected ok');

    const r2 = ticTacToeEngine.reduce(r1.value, {
      type: 'PIECE_PLACED', cell: 1, playerId: 'p2',
    });
    expect(r2.ok).toBe(true);
    if (!r2.ok) throw new Error('Expected ok');
    expect(r2.value.board[1]).toBe('O');
  });
});

// ─── JER-51: reduce() — error cases ─────────────────────────

describe('TicTacToe reduce() — errors', () => {
  const fresh = ticTacToeEngine.init({}, ['p1', 'p2']);

  test('CELL_OCCUPIED: placing on occupied cell', () => {
    // Place X at 0
    const r1 = ticTacToeEngine.reduce(fresh, {
      type: 'PIECE_PLACED', cell: 0, playerId: 'p1',
    });
    expect(r1.ok).toBe(true);
    if (!r1.ok) throw new Error('Expected ok');

    // Try to place O at 0 (already occupied)
    const r2 = ticTacToeEngine.reduce(r1.value, {
      type: 'PIECE_PLACED', cell: 0, playerId: 'p2',
    });
    expect(r2.ok).toBe(false);
    if (r2.ok) throw new Error('Expected error');
    expect(r2.error).toBe('CELL_OCCUPIED');
  });

  test('CELL_OCCUPIED: placing on cell occupied by opponent', () => {
    const r1 = ticTacToeEngine.reduce(fresh, {
      type: 'PIECE_PLACED', cell: 4, playerId: 'p1',
    });
    expect(r1.ok).toBe(true);
    if (!r1.ok) throw new Error('Expected ok');

    // p2 tries to place on cell 4 (occupied by X)
    const r2 = ticTacToeEngine.reduce(r1.value, {
      type: 'PIECE_PLACED', cell: 4, playerId: 'p2',
    });
    expect(r2.ok).toBe(false);
    if (r2.ok) throw new Error('Expected error');
    expect(r2.error).toBe('CELL_OCCUPIED');
  });

  test('NOT_YOUR_TURN: wrong player makes a move', () => {
    // It's p1's turn, but p2 tries to move
    const r = ticTacToeEngine.reduce(fresh, {
      type: 'PIECE_PLACED', cell: 2, playerId: 'p2',
    });
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('Expected error');
    expect(r.error).toBe('NOT_YOUR_TURN');
  });

  test('NOT_YOUR_TURN: p1 tries on p2 turn', () => {
    const r1 = ticTacToeEngine.reduce(fresh, {
      type: 'PIECE_PLACED', cell: 0, playerId: 'p1',
    });
    expect(r1.ok).toBe(true);
    if (!r1.ok) throw new Error('Expected ok');

    // It's now p2's turn, but p1 tries again
    const r2 = ticTacToeEngine.reduce(r1.value, {
      type: 'PIECE_PLACED', cell: 1, playerId: 'p1',
    });
    expect(r2.ok).toBe(false);
    if (r2.ok) throw new Error('Expected error');
    expect(r2.error).toBe('NOT_YOUR_TURN');
  });

  test('GAME_OVER: move after game ended', () => {
    // Set up a finished game: X wins with top row
    const finishedState: TicTacToeState = {
      gameType: 'tic-tac-toe',
      players: [
        { sessionId: 'p1', displayName: 'Alice', createdAt: 0, symbol: 'X' },
        { sessionId: 'p2', displayName: 'Bob', createdAt: 0, symbol: 'O' },
      ],
      currentTurn: 'p2', // Game ended but turn is stale
      moveCount: 5,
      board: ['X', 'X', 'X', 'O', 'O', '', '', '', ''],
    };

    const r = ticTacToeEngine.reduce(finishedState, {
      type: 'PIECE_PLACED', cell: 5, playerId: 'p2',
    });
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('Expected error');
    expect(r.error).toBe('GAME_OVER');
  });
});
