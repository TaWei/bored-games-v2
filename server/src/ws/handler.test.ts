import { test, expect } from 'bun:test';
import { validateWsParams } from './handler';

const VALID_UUID = '123e4567-e89b-42d3-a456-426614174000';
const VALID_ROOM = 'ABCDEF';

test('valid room and sessionId passes validation', () => {
  const result = validateWsParams(VALID_ROOM, VALID_UUID);
  expect(result.ok).toBe(true);
});

test('missing room code returns error', () => {
  const result = validateWsParams(null, VALID_UUID);
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error).toContain('room');
  }
});

test('missing sessionId returns error', () => {
  const result = validateWsParams(VALID_ROOM, null);
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error).toContain('sessionId');
  }
});

test('invalid room code returns error', () => {
  const result = validateWsParams('abc', VALID_UUID);
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error).toContain('room');
  }
});

test('invalid sessionId returns error', () => {
  const result = validateWsParams(VALID_ROOM, 'not-a-uuid');
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error).toContain('session');
  }
});

test('both missing returns error', () => {
  const result = validateWsParams(null, null);
  expect(result.ok).toBe(false);
});

// ─── JER-74: HTTP upgrade endpoint ────────────────────────

// We can't easily test WebSocket upgrade via Hono's app.request(),
// but we can test that invalid params return 400.

test('GET /ws without params returns 400', async () => {
  const { app } = await import('../index');
  const res = await app.request('/ws');
  expect(res.status).toBe(400);
});

test('GET /ws with valid params returns something other than 400', async () => {
  const { app } = await import('../index');
  const res = await app.request(
    `/ws?room=ABCDEF&sessionId=123e4567-e89b-42d3-a456-426614174000`
  );
  // Bun's server.upgrade() inside Hono returns a specific response
  // We just verify it's not a 400 error
  expect(res.status).not.toBe(400);
});

test('GET /ws with only room returns 400', async () => {
  const { app } = await import('../index');
  const res = await app.request('/ws?room=ABCDEF');
  expect(res.status).toBe(400);
});

// ─── JER-75: Open handler — connection tracking ───────────

import { getRoomConnections, addConnection, removeConnection, clearConnections } from './handler';

test('addConnection registers connection in room set', () => {
  clearConnections();
  const ws = { data: { room: 'ABCDEF', sessionId: VALID_UUID }, close() {}, send() {} } as any;
  addConnection('ABCDEF', ws);
  const conns = getRoomConnections('ABCDEF');
  expect(conns).toBeDefined();
  expect(conns!.has(ws)).toBe(true);
});

test('addConnection same room multiple connections', () => {
  clearConnections();
  const ws1 = { data: { room: 'ABCDEF', sessionId: 'p1' }, close() {}, send() {} } as any;
  const ws2 = { data: { room: 'ABCDEF', sessionId: 'p2' }, close() {}, send() {} } as any;
  addConnection('ABCDEF', ws1);
  addConnection('ABCDEF', ws2);
  const conns = getRoomConnections('ABCDEF');
  expect(conns!.size).toBe(2);
});

test('removeConnection removes from room set', () => {
  clearConnections();
  const ws = { data: { room: 'ABCDEF', sessionId: VALID_UUID }, close() {}, send() {} } as any;
  addConnection('ABCDEF', ws);
  removeConnection('ABCDEF', ws);
  const conns = getRoomConnections('ABCDEF');
  expect(conns).toBeUndefined();
});

test('getRoomConnections returns undefined for unknown room', () => {
  clearConnections();
  const conns = getRoomConnections('UNKNOWN');
  expect(conns).toBeUndefined();
});

// ─── JER-76: Message parser ────────────────────────────────

import { handleWSMessage } from './handler';

function makeWs() {
  const sent: string[] = [];
  return {
    data: { room: 'ABCDEF', sessionId: VALID_UUID },
    send(data: string) { sent.push(data); },
    close() {},
    _sent: sent,
  };
}

test('handleWSMessage parses valid JSON and routes by type', () => {
  const ws: any = makeWs();
  handleWSMessage(ws, JSON.stringify({ type: 'HEARTBEAT' }));
  expect(ws._sent.length).toBe(1);
  expect(JSON.parse(ws._sent[0]).type).toBe('PONG');
});

test('handleWSMessage ignores invalid JSON', () => {
  const ws: any = makeWs();
  handleWSMessage(ws, 'not json');
  expect(ws._sent.length).toBe(0);
});

test('handleWSMessage ignores messages without type', () => {
  const ws: any = makeWs();
  handleWSMessage(ws, JSON.stringify({ data: 'hello' }));
  expect(ws._sent.length).toBe(0);
});

// ─── JER-77: Heartbeat ─────────────────────────────────────

test('HEARTBEAT message receives PONG response', () => {
  const ws: any = makeWs();
  handleWSMessage(ws, JSON.stringify({ type: 'HEARTBEAT' }));
  expect(ws._sent.length).toBe(1);
  const pong = JSON.parse(ws._sent[0]);
  expect(pong.type).toBe('PONG');
});

// ─── JER-78: Close handler ─────────────────────────────────

import { handleWSClose } from './handler';

test('handleWSClose removes connection from room', () => {
  clearConnections();
  const ws: any = makeWs();
  addConnection('ABCDEF', ws);
  expect(getRoomConnections('ABCDEF')?.size).toBe(1);
  handleWSClose(ws);
  expect(getRoomConnections('ABCDEF')).toBeUndefined();
});

// ─── JER-79: Reconnect ─────────────────────────────────────

import { handleWSOpen } from './handler';

test('handleWSOpen registers connection in room set', () => {
  clearConnections();
  const ws: any = makeWs();
  handleWSOpen(ws);
  const conns = getRoomConnections('ABCDEF');
  expect(conns).toBeDefined();
  expect(conns!.has(ws)).toBe(true);
});
