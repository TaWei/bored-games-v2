import { describe, test, expect } from 'bun:test';

// Import the type we're testing — this will fail since types.ts doesn't exist yet
import type { GameType } from './types';

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
