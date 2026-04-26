import { describe, test, expect } from 'bun:test';
import { generateDisplayName, isValidDisplayName } from './display-name';

describe('generateDisplayName', () => {
  test('returns AdjectiveNoun format', () => {
    const name = generateDisplayName();
    // Should be two words with capital first letters
    expect(/^[A-Z][a-z]+[A-Z][a-z]+$/.test(name)).toBe(true);
  });

  test('generates different names', () => {
    const names = new Set<string>();
    for (let i = 0; i < 50; i++) {
      names.add(generateDisplayName());
    }
    // Should generate at least some variety
    expect(names.size).toBeGreaterThan(5);
  });
});

describe('isValidDisplayName', () => {
  test('accepts valid names', () => {
    expect(isValidDisplayName('Alice')).toBe(true);
    expect(isValidDisplayName('Bob')).toBe(true);
    expect(isValidDisplayName('CoolPlayer')).toBe(true);
  });

  test('rejects empty string', () => {
    expect(isValidDisplayName('')).toBe(false);
  });

  test('rejects too long names', () => {
    expect(isValidDisplayName('A'.repeat(51))).toBe(false);
  });

  test('accepts max-length name (50 chars)', () => {
    expect(isValidDisplayName('A'.repeat(50))).toBe(true);
  });

  test('rejects whitespace-only', () => {
    expect(isValidDisplayName('   ')).toBe(false);
  });
});
