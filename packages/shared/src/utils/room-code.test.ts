import { describe, test, expect } from 'bun:test';
import { generateRoomCode, isValidRoomCode } from './room-code';

describe('generateRoomCode', () => {
  test('returns 6-character string', () => {
    const code = generateRoomCode();
    expect(code.length).toBe(6);
    expect(typeof code).toBe('string');
  });

  test('contains only alphanumeric characters', () => {
    const code = generateRoomCode();
    expect(/^[A-Z0-9]{6}$/.test(code)).toBe(true);
  });

  test('generates different codes on successive calls', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      codes.add(generateRoomCode());
    }
    // With 6-char alphanumeric, collision probability is negligible for 100 calls
    expect(codes.size).toBe(100);
  });
});

describe('isValidRoomCode', () => {
  test('accepts valid 6-char code', () => {
    expect(isValidRoomCode('ABC123')).toBe(true);
    expect(isValidRoomCode('A1B2C3')).toBe(true);
  });

  test('rejects too short codes', () => {
    expect(isValidRoomCode('ABC12')).toBe(false);
    expect(isValidRoomCode('A')).toBe(false);
  });

  test('rejects too long codes', () => {
    expect(isValidRoomCode('ABC1234')).toBe(false);
  });

  test('rejects codes with invalid characters', () => {
    expect(isValidRoomCode('ABC-12')).toBe(false);
    expect(isValidRoomCode('ABC 12')).toBe(false);
    expect(isValidRoomCode('abc123')).toBe(false); // lowercase
  });

  test('rejects empty string', () => {
    expect(isValidRoomCode('')).toBe(false);
  });
});
