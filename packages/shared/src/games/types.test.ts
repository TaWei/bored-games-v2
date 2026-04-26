import { describe, test, expect } from 'bun:test';
import type { Result } from './types';

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
