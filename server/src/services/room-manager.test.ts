import { test, expect, afterAll } from 'bun:test';
import { redis } from '../lib/redis';
import { createRoom } from './room-manager';

// Clean up Redis after all tests
afterAll(async () => {
  await redis.quit();
});

// JER-63: createRoom tests
test('createRoom creates a room with a 6-char code', async () => {
  const room = await createRoom('tic-tac-toe', 'host-session-123', 'Alice');
  expect(room.code).toMatch(/^[A-Z0-9]{6}$/);
  // Cleanup
  await redis.del(`room:${room.code}`);
});

test('createRoom host is in players array with sessionId and displayName', async () => {
  const room = await createRoom('tic-tac-toe', 'host-session-abc', 'Bob');
  expect(room.players.length).toBe(1);
  expect(room.players[0].sessionId).toBe('host-session-abc');
  expect(room.players[0].displayName).toBe('Bob');
  await redis.del(`room:${room.code}`);
});

test('createRoom room status is waiting', async () => {
  const room = await createRoom('tic-tac-toe', 'host-session-1', 'Charlie');
  expect(room.status).toBe('waiting');
  await redis.del(`room:${room.code}`);
});

test('createRoom room has maxPlayers from engine meta (2 for tic-tac-toe)', async () => {
  const room = await createRoom('tic-tac-toe', 'host-session-2', 'Dana');
  expect(room.maxPlayers).toBe(2);
  await redis.del(`room:${room.code}`);
});

test('createRoom room is persisted in Redis (can read it back)', async () => {
  const room = await createRoom('tic-tac-toe', 'host-session-persist', 'Eve');
  const data = await redis.get(`room:${room.code}`);
  expect(data).not.toBeNull();
  const parsed = JSON.parse(data as string);
  expect(parsed.code).toBe(room.code);
  expect(parsed.gameType).toBe('tic-tac-toe');
  await redis.del(`room:${room.code}`);
});

test('createRoom room has TTL set on Redis key', async () => {
  const room = await createRoom('tic-tac-toe', 'host-session-ttl', 'Frank');
  const ttl = await redis.ttl(`room:${room.code}`);
  // TTL should be set (greater than 0). Default is 30 minutes = 1800 seconds.
  expect(ttl).toBeGreaterThan(0);
  expect(ttl).toBeLessThanOrEqual(1800);
  await redis.del(`room:${room.code}`);
});
