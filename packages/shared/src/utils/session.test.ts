import { describe, test, expect } from 'bun:test';
import { generateSessionId, isValidSessionId } from './session';

describe('generateSessionId', () => {
  test('returns valid UUID format', () => {
    const id = generateSessionId();
    expect(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id)).toBe(true);
  });

  test('generates unique IDs', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateSessionId());
    }
    expect(ids.size).toBe(100);
  });
});

describe('isValidSessionId', () => {
  test('accepts valid UUID', () => {
    expect(isValidSessionId('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  test('rejects invalid format', () => {
    expect(isValidSessionId('not-a-uuid')).toBe(false);
    expect(isValidSessionId('')).toBe(false);
  });

  test('rejects UUID with wrong version', () => {
    // v1 UUID (time-based)
    expect(isValidSessionId('550e8400-e29b-11d4-a716-446655440000')).toBe(false);
  });

  test('rejects nil UUID', () => {
    expect(isValidSessionId('00000000-0000-0000-0000-000000000000')).toBe(false);
  });
});
