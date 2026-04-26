/**
 * Session ID utilities.
 * Session IDs are UUID v4 strings (e.g., "550e8400-e29b-41d4-a716-446655440000").
 * Anonymous by default — no account required (Principle 8).
 */

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/**
 * Generate a new crypto-random session ID (UUID v4).
 */
export function generateSessionId(): string {
  return crypto.randomUUID();
}

/**
 * Validate a session ID string. Rejects nil UUIDs.
 */
export function isValidSessionId(id: string): boolean {
  if (id === '00000000-0000-0000-0000-000000000000') return false;
  return UUID_V4_REGEX.test(id);
}
