/**
 * Room code utilities.
 * Room codes are 6-character uppercase alphanumeric strings (e.g., "ABC123").
 */

const ROOM_CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const ROOM_CODE_LENGTH = 6;
const ROOM_CODE_REGEX = /^[A-Z0-9]{6}$/;

/**
 * Generate a random 6-character room code.
 * Uses crypto.randomUUID for entropy — no Math.random().
 */
export function generateRoomCode(): string {
  const bytes = new Uint8Array(ROOM_CODE_LENGTH);
  crypto.getRandomValues(bytes);
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_CHARS[bytes[i] % ROOM_CODE_CHARS.length];
  }
  return code;
}

/**
 * Validate a room code string.
 */
export function isValidRoomCode(code: string): boolean {
  return ROOM_CODE_REGEX.test(code);
}
