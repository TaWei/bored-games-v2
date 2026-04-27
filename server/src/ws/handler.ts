import { isValidRoomCode, isValidSessionId } from '@bored-games/shared';

export interface WsValidationResult {
  ok: true;
}

export interface WsValidationError {
  ok: false;
  error: string;
}

/**
 * Validate WebSocket upgrade query parameters.
 * Returns ok:true if both room and sessionId are valid,
 * or ok:false with an error message describing what's wrong.
 */
export function validateWsParams(
  room: string | null,
  sessionId: string | null
): WsValidationResult | WsValidationError {
  if (!room || !isValidRoomCode(room)) {
    return { ok: false, error: 'Missing or invalid room code' };
  }
  if (!sessionId || !isValidSessionId(sessionId)) {
    return { ok: false, error: 'Missing or invalid sessionId' };
  }
  return { ok: true };
}
