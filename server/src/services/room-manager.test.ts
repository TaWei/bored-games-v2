import { test, expect, afterAll } from 'bun:test';
import { redis } from '../lib/redis';
import { createRoom, getRoom, updateRoom } from './room-manager';

// Clean up any leaked Redis keys after all tests
afterAll(async () => {
  // Note: redis.quit() is called by redis.test.ts — don't double-close the shared connection
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

// JER-64: getRoom tests
test('getRoom returns the room for a valid code', async () => {
  const created = await createRoom('tic-tac-toe', 'host-get', 'Grace');
  const room = await getRoom(created.code);
  expect(room).not.toBeNull();
  expect(room!.code).toBe(created.code);
  expect(room!.gameType).toBe('tic-tac-toe');
  await redis.del(`room:${created.code}`);
});

test('getRoom returns null for unknown code', async () => {
  const room = await getRoom('ZZZZZZ');
  expect(room).toBeNull();
});

test('getRoom returns null for non-existent code', async () => {
  const room = await getRoom('000000');
  expect(room).toBeNull();
});

// JER-65: updateRoom tests
test('updateRoom persists changed fields', async () => {
  const room = await createRoom('tic-tac-toe', 'host-update', 'Heidi');
  const updated = { ...room, status: 'in_progress' as const };
  await updateRoom(updated);
  const fetched = await getRoom(room.code);
  expect(fetched).not.toBeNull();
  expect(fetched!.status).toBe('in_progress');
  await redis.del(`room:${room.code}`);
});

test('updateRoom refreshes TTL on Redis key', async () => {
  const room = await createRoom('tic-tac-toe', 'host-ttl-refresh', 'Ivan');
  const updated = { ...room, status: 'in_progress' as const };
  await updateRoom(updated);
  const ttl = await redis.ttl(`room:${room.code}`);
  expect(ttl).toBeGreaterThan(0);
  expect(ttl).toBeLessThanOrEqual(1800);
  await redis.del(`room:${room.code}`);
});

test('reading back after update returns the updated room', async () => {
  const room = await createRoom('tic-tac-toe', 'host-readback', 'Judy');
  const updated = { ...room, status: 'finished' as const, rematchRequests: ['player-1'] };
  await updateRoom(updated);
  const fetched = await getRoom(room.code);
  expect(fetched).not.toBeNull();
  expect(fetched!.status).toBe('finished');
  expect(fetched!.rematchRequests).toEqual(['player-1']);
  await redis.del(`room:${room.code}`);
});

test('updateRoom preserves the room code', async () => {
  const room = await createRoom('tic-tac-toe', 'host-code', 'Kyle');
  const updated = { ...room, status: 'abandoned' as const };
  await updateRoom(updated);
  const fetched = await getRoom(room.code);
  expect(fetched).not.toBeNull();
  expect(fetched!.code).toBe(room.code);
  await redis.del(`room:${room.code}`);
});
