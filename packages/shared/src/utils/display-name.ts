/**
 * Display name utilities.
 * Display names are ephemeral and changeable — no account required (Principle 8).
 * Format: AdjectiveNoun (e.g., "SwiftFox", "CleverPanda").
 */

const ADJECTIVES = [
  'Swift', 'Clever', 'Brave', 'Calm', 'Eager',
  'Fierce', 'Gentle', 'Happy', 'Jolly', 'Keen',
  'Lucky', 'Merry', 'Noble', 'Proud', 'Quick',
  'Sharp', 'Wise', 'Bold', 'Cool', 'Fair',
  'Grand', 'Kind', 'Lively', 'Neat', 'Plucky',
];

const NOUNS = [
  'Fox', 'Panda', 'Hawk', 'Wolf', 'Bear',
  'Lynx', 'Otter', 'Eagle', 'Tiger', 'Falcon',
  'Deer', 'Owl', 'Raven', 'Lion', 'Hare',
  'Dove', 'Elk', 'Finch', 'Heron', 'Jay',
  'Mink', 'Newt', 'Pike', 'Quail', 'Seal',
];

const MAX_DISPLAY_NAME_LENGTH = 50;

/**
 * Generate a random display name in AdjectiveNoun format.
 * Uses crypto.getRandomValues for entropy.
 */
export function generateDisplayName(): string {
  const adj = ADJECTIVES[Math.floor(cryptoRandom() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(cryptoRandom() * NOUNS.length)];
  return `${adj}${noun}`;
}

/**
 * Deterministic random number from crypto.getRandomValues.
 * Avoids Math.random() in utilities that need to be reproducible.
 */
function cryptoRandom(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] / (0xFFFFFFFF + 1);
}

/**
 * Validate a display name.
 * - Must be non-empty after trimming
 * - Max 50 characters
 */
export function isValidDisplayName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length > 0 && trimmed.length <= MAX_DISPLAY_NAME_LENGTH;
}
