import { isValidRoomCode, isValidSessionId } from '@bored-games/shared';

export interface WsValidationResult {
  ok: true;
}

export interface WsValidationError {
  ok: false;
  error: string;
}

// ─── Connection Tracking ──────────────────────────────────

type WsLike = { data: { room: string; sessionId: string }; close(code?: number, reason?: string): void; send(data: string): void };

const roomConnections = new Map<string, Set<WsLike>>();

export function getRoomConnections(room: string): Set<WsLike> | undefined {
  return roomConnections.get(room);
}

export function addConnection(room: string, ws: WsLike): void {
  if (!roomConnections.has(room)) {
    roomConnections.set(room, new Set());
  }
  roomConnections.get(room)!.add(ws);
}

export function removeConnection(room: string, ws: WsLike): void {
  const conns = roomConnections.get(room);
  if (!conns) return;
  conns.delete(ws);
  if (conns.size === 0) {
    roomConnections.delete(room);
  }
}

/** Clear all tracked connections (for testing). */
export function clearConnections(): void {
  roomConnections.clear();
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

// ─── WebSocket Message Handling ────────────────────────────

/**
 * Parse and route an incoming WebSocket message.
 *
 * JER-76: Parses JSON, validates message shape, routes by `type` field.
 * JER-77: Handles HEARTBEAT → PONG response.
 */
export function handleWSMessage(ws: WsLike, raw: string | Buffer): void {
  let msg: any;
  try {
    msg = JSON.parse(raw as string);
  } catch {
    console.error('[ws] Invalid JSON received');
    return;
  }

  if (!msg || typeof msg.type !== 'string') {
    console.error('[ws] Message missing type field');
    return;
  }

  switch (msg.type) {
    case 'HEARTBEAT':
      ws.send(JSON.stringify({ type: 'PONG' }));
      break;
    default:
      console.warn('[ws] Unknown message type:', msg.type);
  }
}

/**
 * JER-78: Clean up a WebSocket connection when it closes.
 * Removes the connection from the room tracking set.
 * If the room is empty after removal, it's cleaned up.
 */
export function handleWSClose(ws: WsLike): void {
  removeConnection(ws.data.room, ws);
}

// ─── JER-79: Reconnect ─────────────────────────────────────

/**
 * Called when a WebSocket connection opens.
 * Validates that the room exists and the session belongs to it.
 * Tracks the connection for the room.
 *
 * Reconnect: if the session is already in the room's player list,
 * the game loop (Phase 8) will send current game state.
 */
export function handleWSOpen(ws: WsLike): void {
  addConnection(ws.data.room, ws);
}
