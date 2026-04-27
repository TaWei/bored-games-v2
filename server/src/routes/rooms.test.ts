import { test, expect, afterAll } from 'bun:test';
import { app } from '../index';
import { redis } from '../lib/redis';

// Track created room codes for cleanup
const cleanupCodes: string[] = [];

afterAll(async () => {
  for (const code of cleanupCodes) {
    await redis.del(`room:${code}`);
  }
});

// ────────────────────────────────────────────────────────────
// JER-68: POST /api/rooms
// ────────────────────────────────────────────────────────────

test('POST /api/rooms with valid body returns 201 with roomCode and room', async () => {
  const res = await app.request('/api/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      gameType: 'tic-tac-toe',
      hostSessionId: 'host-68-a',
      displayName: 'Alice',
    }),
  });

  expect(res.status).toBe(201);
  const body = await res.json();
  expect(body.roomCode).toBeString();
  expect(body.roomCode).toMatch(/^[A-Z0-9]{6}$/);
  expect(body.room).toBeObject();
  expect(body.room.code).toBe(body.roomCode);
  cleanupCodes.push(body.roomCode);
});

test('POST /api/rooms created room has correct gameType', async () => {
  const res = await app.request('/api/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      gameType: 'tic-tac-toe',
      hostSessionId: 'host-68-b',
      displayName: 'Bob',
    }),
  });

  const body = await res.json();
  expect(body.room.gameType).toBe('tic-tac-toe');
  cleanupCodes.push(body.roomCode);
});

test('POST /api/rooms created room has host as first player', async () => {
  const res = await app.request('/api/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      gameType: 'tic-tac-toe',
      hostSessionId: 'host-68-c',
      displayName: 'Charlie',
    }),
  });

  const body = await res.json();
  expect(body.room.players).toBeArray();
  expect(body.room.players.length).toBe(1);
  expect(body.room.players[0].sessionId).toBe('host-68-c');
  expect(body.room.players[0].displayName).toBe('Charlie');
  cleanupCodes.push(body.roomCode);
});

test('POST /api/rooms with missing gameType returns 400', async () => {
  const res = await app.request('/api/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      hostSessionId: 'host-68-d',
      displayName: 'Dave',
    }),
  });

  expect(res.status).toBe(400);
  const body = await res.json();
  expect(body.error).toBeString();
});

test('POST /api/rooms with unknown gameType returns 400', async () => {
  const res = await app.request('/api/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      gameType: 'unknown-game',
      hostSessionId: 'host-68-e',
      displayName: 'Eve',
    }),
  });

  expect(res.status).toBe(400);
  const body = await res.json();
  expect(body.error).toBeString();
});

test('POST /api/rooms with missing hostSessionId returns 400', async () => {
  const res = await app.request('/api/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      gameType: 'tic-tac-toe',
      displayName: 'Frank',
    }),
  });

  expect(res.status).toBe(400);
  const body = await res.json();
  expect(body.error).toBeString();
});

test('POST /api/rooms with missing displayName returns 400', async () => {
  const res = await app.request('/api/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      gameType: 'tic-tac-toe',
      hostSessionId: 'host-68-g',
    }),
  });

  expect(res.status).toBe(400);
  const body = await res.json();
  expect(body.error).toBeString();
});
