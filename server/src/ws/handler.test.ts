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
