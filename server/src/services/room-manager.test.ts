import { test, expect, afterAll } from 'bun:test';
import { redis } from '../lib/redis';
import { createRoom, getRoom, updateRoom, joinRoom, leaveRoom } from './room-manager';

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

// ────────────────────────────────────────────────────────────
// JER-66: joinRoom tests
// ────────────────────────────────────────────────────────────

test('joinRoom adds a second player with symbol O', async () => {
  const room = await createRoom('tic-tac-toe', 'host-join-1', 'Alice');
  const updated = await joinRoom(room.code, 'player-2', 'Bob');
  expect(updated.players.length).toBe(2);
  expect(updated.players[1].sessionId).toBe('player-2');
  expect(updated.players[1].displayName).toBe('Bob');
  expect(updated.players[1].symbol).toBe('O');
  await redis.del(`room:${room.code}`);
});

test('joinRoom joining with same sessionId returns current room (idempotent)', async () => {
  const room = await createRoom('tic-tac-toe', 'host-join-2', 'Alice');
  // Join with the host's sessionId
  const result = await joinRoom(room.code, 'host-join-2', 'Alice');
  expect(result.players.length).toBe(1); // Still only 1 player
  expect(result.code).toBe(room.code);
  await redis.del(`room:${room.code}`);
});

test('joinRoom joining a full room throws an error', async () => {
  const room = await createRoom('tic-tac-toe', 'host-join-3', 'Alice');
  await joinRoom(room.code, 'player-2', 'Bob'); // fills to 2 players (max)
  await expect(joinRoom(room.code, 'player-3', 'Charlie')).rejects.toThrow('Room is full');
  await redis.del(`room:${room.code}`);
});

test('joinRoom joining non-existent room throws an error', async () => {
  await expect(joinRoom('ZZZZZZ', 'player-x', 'Dave')).rejects.toThrow('Room not found');
});

test('joinRoom persists the updated room in Redis', async () => {
  const room = await createRoom('tic-tac-toe', 'host-join-4', 'Alice');
  await joinRoom(room.code, 'player-2', 'Bob');
  const fetched = await getRoom(room.code);
  expect(fetched).not.toBeNull();
  expect(fetched!.players.length).toBe(2);
  await redis.del(`room:${room.code}`);
});

// ────────────────────────────────────────────────────────────
// JER-67: leaveRoom tests
// ────────────────────────────────────────────────────────────

test('leaveRoom removes the player from players array', async () => {
  const room = await createRoom('tic-tac-toe', 'host-leave-1', 'Alice');
  await joinRoom(room.code, 'player-2', 'Bob');
  const result = await leaveRoom(room.code, 'player-2');
  expect(result.players.length).toBe(1);
  expect(result.players[0].sessionId).toBe('host-leave-1');
  await redis.del(`room:${room.code}`);
});

test('leaveRoom if host leaves, next player becomes host', async () => {
  const room = await createRoom('tic-tac-toe', 'host-leave-2', 'Alice');
  await joinRoom(room.code, 'player-2', 'Bob');
  const result = await leaveRoom(room.code, 'host-leave-2');
  expect(result.players.length).toBe(1);
  expect(result.players[0].sessionId).toBe('player-2');
  expect(result.hostSessionId).toBe('player-2');
  await redis.del(`room:${room.code}`);
});

test('leaveRoom if last player leaves, room status is abandoned', async () => {
  const room = await createRoom('tic-tac-toe', 'host-leave-3', 'Alice');
  const result = await leaveRoom(room.code, 'host-leave-3');
  expect(result.players.length).toBe(0);
  expect(result.status).toBe('abandoned');
  await redis.del(`room:${room.code}`);
});

test('leaveRoom a spectator can leave', async () => {
  const room = await createRoom('tic-tac-toe', 'host-leave-4', 'Alice');
  // Add a spectator by directly updating the room
  const withSpectator: Room = {
    ...room,
    spectators: [...room.spectators, { sessionId: 'spec-1', displayName: 'Watcher', createdAt: Date.now() }],
  };
  await updateRoom(withSpectator);
  const result = await leaveRoom(room.code, 'spec-1');
  expect(result.spectators.length).toBe(0);
  expect(result.players.length).toBe(1); // host still there
  await redis.del(`room:${room.code}`);
});

test('leaveRoom leaving non-existent room throws an error', async () => {
  await expect(leaveRoom('ZZZZZZ', 'player-x')).rejects.toThrow('Room not found');
});

test('leaveRoom leaving a room you are not in throws an error', async () => {
  const room = await createRoom('tic-tac-toe', 'host-leave-5', 'Alice');
  await expect(leaveRoom(room.code, 'stranger')).rejects.toThrow('Not in room');
  await redis.del(`room:${room.code}`);
});

test('leaveRoom persists changes to Redis', async () => {
  const room = await createRoom('tic-tac-toe', 'host-leave-6', 'Alice');
  await joinRoom(room.code, 'player-2', 'Bob');
  await leaveRoom(room.code, 'player-2');
  const fetched = await getRoom(room.code);
  expect(fetched).not.toBeNull();
  expect(fetched!.players.length).toBe(1);
  await redis.del(`room:${room.code}`);
});
