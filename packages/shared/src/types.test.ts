import { describe, test, expect } from 'bun:test';

// Import the type we're testing — this will fail since types.ts doesn't exist yet
import type { GameType, SessionMetadata, Player, Spectator } from './types';

describe('GameType', () => {
  test('accepts "tic-tac-toe"', () => {
    // Type-level check: this assignment must compile
    const gt: GameType = 'tic-tac-toe';
    expect(gt).toBe('tic-tac-toe');
  });

  test('rejects other strings', () => {
    // @ts-expect-error: 'chess' is not a valid GameType
    const _unused: GameType = 'chess';
    // If we reach here without a TS error, the test should still pass at runtime
    // The real test is the @ts-expect-error above catching the compile-time error
    expect(true).toBe(true);
  });

  test('rejects empty string', () => {
    // @ts-expect-error: '' is not a valid GameType
    const _unused: GameType = '';
    expect(true).toBe(true);
  });

  test('rejects random string', () => {
    // @ts-expect-error: 'checkers' is not a valid GameType
    const _unused: GameType = 'checkers';
    expect(true).toBe(true);
  });
});

describe('SessionMetadata', () => {
  test('accepts valid shape', () => {
    const meta: SessionMetadata = {
      sessionId: 'abc-123',
      displayName: 'TestPlayer',
      createdAt: Date.now(),
    };
    expect(meta.sessionId).toBe('abc-123');
    expect(meta.displayName).toBe('TestPlayer');
    expect(typeof meta.createdAt).toBe('number');
  });

  // @ts-expect-error: missing sessionId
  test('rejects missing sessionId', () => {
    const _bad: SessionMetadata = { displayName: 'Test', createdAt: 0 };
    expect(true).toBe(true);
  });

  // @ts-expect-error: missing displayName
  test('rejects missing displayName', () => {
    const _bad: SessionMetadata = { sessionId: 'x', createdAt: 0 };
    expect(true).toBe(true);
  });
});

describe('Player', () => {
  test('accepts valid shape', () => {
    const player: Player = {
      sessionId: 'p1',
      displayName: 'Alice',
      createdAt: Date.now(),
      symbol: 'X',
    };
    expect(player.symbol).toBe('X');
    expect(player.sessionId).toBe('p1');
  });

  // @ts-expect-error: missing symbol
  test('rejects missing symbol', () => {
    const _bad: Player = {
      sessionId: 'p1',
      displayName: 'Alice',
      createdAt: 0,
    };
    expect(true).toBe(true);
  });
});

describe('Spectator', () => {
  test('accepts valid shape (same as SessionMetadata)', () => {
    const spec: Spectator = {
      sessionId: 's1',
      displayName: 'Watcher',
      createdAt: Date.now(),
    };
    expect(spec.sessionId).toBe('s1');
  });
});
