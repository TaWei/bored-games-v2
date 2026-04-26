import { describe, test, expect } from 'bun:test';
import type { Result } from './types';
import type { GameEngine } from './types';

describe('Result<T, E>', () => {
  test('ok variant holds success value', () => {
    const ok: Result<number, string> = { ok: true, value: 42 };
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.value).toBe(42);
    }
  });

  test('error variant holds error value', () => {
    const err: Result<number, string> = { ok: false, error: 'something went wrong' };
    expect(err.ok).toBe(false);
    if (!err.ok) {
      expect(err.error).toBe('something went wrong');
    }
  });

  test('discriminated union narrows correctly with if/else', () => {
    const result: Result<number, string> = { ok: true, value: 99 };

    if (result.ok) {
      // TypeScript narrows to ok variant — value is accessible, error is not
      const n: number = result.value;
      expect(n).toBe(99);
    } else {
      // TypeScript narrows to error variant — error is accessible, value is not
      const e: string = result.error;
      expect(e).toBeDefined();
    }
  });

  test('works with complex types', () => {
    type User = { id: string; name: string };
    type DbError = { code: number; message: string };

    const success: Result<User, DbError> = {
      ok: true,
      value: { id: 'u1', name: 'Alice' },
    };
    expect(success.ok).toBe(true);
    if (success.ok) {
      expect(success.value.name).toBe('Alice');
    }

    const failure: Result<User, DbError> = {
      ok: false,
      error: { code: 500, message: 'DB down' },
    };
    expect(failure.ok).toBe(false);
    if (!failure.ok) {
      expect(failure.error.code).toBe(500);
    }
  });
});

// ─── JER-44: GameEngine Interface ───────────────────────────

// Dummy types for compile-time interface checks
type MockState = { readonly cells: readonly string[]; readonly turn: string };
type MockConfig = { readonly boardSize: number };
type MockEvent = { readonly type: 'PLACE'; readonly cell: number; readonly playerId: string };
type MockView = { readonly cells: readonly string[] };

describe('GameEngine interface', () => {
  test('valid engine compiles with all required members', () => {
    // A complete engine must have: gameType, playerCount, meta, init, reduce, legalEvents, checkEnd, view
    const engine: GameEngine<MockState, MockConfig, MockEvent, MockView> = {
      gameType: 'tic-tac-toe',
      playerCount: { min: 2, max: 2 },
      meta: {
        gameType: 'tic-tac-toe',
        name: 'Tic-Tac-Toe',
        description: 'Test game',
        minPlayers: 2,
        maxPlayers: 2,
        slug: 'tic-tac-toe',
        icon: '🎯',
      },
      init: (_config: MockConfig, _playerIds: readonly string[]) => ({
        cells: [],
        turn: _playerIds[0],
      }),
      reduce: (state: MockState, event: MockEvent): Result<MockState, string> => ({
        ok: true,
        value: state,
      }),
      legalEvents: (_state: MockState, _playerId: string): readonly MockEvent[] => [],
      checkEnd: (_state: MockState) => null,
      view: (state: MockState, _playerId: string): MockView => ({ cells: state.cells }),
    };

    expect(engine.gameType).toBe('tic-tac-toe');
    expect(engine.playerCount.min).toBe(2);
    expect(engine.playerCount.max).toBe(2);
    expect(engine.meta.name).toBe('Tic-Tac-Toe');
  });

  test('init returns state with correct shape', () => {
    const engine: GameEngine<MockState, MockConfig, MockEvent, MockView> = {
      gameType: 'tic-tac-toe',
      playerCount: { min: 2, max: 2 },
      meta: { gameType: 'tic-tac-toe', name: 'TTT', description: '', minPlayers: 2, maxPlayers: 2, slug: 'ttt', icon: 'X' },
      init: (_config, playerIds) => ({ cells: ['X', '', ''], turn: playerIds[0] }),
      reduce: (state, _event) => ({ ok: true, value: state }),
      legalEvents: () => [],
      checkEnd: () => null,
      view: (state) => ({ cells: state.cells }),
    };

    const state = engine.init({ boardSize: 3 }, ['p1', 'p2']);
    expect(state.cells).toEqual(['X', '', '']);
    expect(state.turn).toBe('p1');
  });

  test('reduce uses Result<T,E> return type', () => {
    const engine: GameEngine<MockState, MockConfig, MockEvent, MockView> = {
      gameType: 'tic-tac-toe',
      playerCount: { min: 2, max: 2 },
      meta: { gameType: 'tic-tac-toe', name: 'TTT', description: '', minPlayers: 2, maxPlayers: 2, slug: 'ttt', icon: 'X' },
      init: (_config, playerIds) => ({ cells: [], turn: playerIds[0] }),
      reduce: (_state, _event) => ({ ok: true, value: { cells: ['X'], turn: 'p2' } }),
      legalEvents: () => [],
      checkEnd: () => null,
      view: (state) => ({ cells: state.cells }),
    };

    const result = engine.reduce({ cells: [], turn: 'p1' }, { type: 'PLACE', cell: 0, playerId: 'p1' });
    expect(result.ok).toBe(true);
  });

  // @ts-expect-error: missing reduce method
  test('rejects engine missing reduce', () => {
    const _bad: GameEngine<MockState, MockConfig, MockEvent, MockView> = {
      gameType: 'tic-tac-toe',
      playerCount: { min: 2, max: 2 },
      meta: { gameType: 'tic-tac-toe', name: 'TTT', description: '', minPlayers: 2, maxPlayers: 2, slug: 'ttt', icon: 'X' },
      init: (_config, playerIds) => ({ cells: [], turn: playerIds[0] }),
      // missing reduce
      legalEvents: () => [],
      checkEnd: () => null,
      view: (state) => ({ cells: state.cells }),
    };
    expect(true).toBe(true);
  });

  // @ts-expect-error: missing init method
  test('rejects engine missing init', () => {
    const _bad: GameEngine<MockState, MockConfig, MockEvent, MockView> = {
      gameType: 'tic-tac-toe',
      playerCount: { min: 2, max: 2 },
      meta: { gameType: 'tic-tac-toe', name: 'TTT', description: '', minPlayers: 2, maxPlayers: 2, slug: 'ttt', icon: 'X' },
      reduce: (state, _event) => ({ ok: true, value: state }),
      legalEvents: () => [],
      checkEnd: () => null,
      view: (state) => ({ cells: state.cells }),
    };
    expect(true).toBe(true);
  });

  // @ts-expect-error: missing legalEvents method
  test('rejects engine missing legalEvents', () => {
    const _bad: GameEngine<MockState, MockConfig, MockEvent, MockView> = {
      gameType: 'tic-tac-toe',
      playerCount: { min: 2, max: 2 },
      meta: { gameType: 'tic-tac-toe', name: 'TTT', description: '', minPlayers: 2, maxPlayers: 2, slug: 'ttt', icon: 'X' },
      init: (_config, playerIds) => ({ cells: [], turn: playerIds[0] }),
      reduce: (state, _event) => ({ ok: true, value: state }),
      checkEnd: () => null,
      view: (state) => ({ cells: state.cells }),
    };
    expect(true).toBe(true);
  });
});
