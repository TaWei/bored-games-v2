import type { Room, GameType } from '@bored-games/shared';
import { generateRoomCode } from '@bored-games/shared';
import { redis } from '../lib/redis';
import { config } from '../lib/config';

// Side-effect import: registers game engines
import '@bored-games/shared/src/games';
import { getEngine } from '@bored-games/shared/src/games/registry';

/**
 * Create a new game room.
 * The creating player becomes the host and first player.
 */
export async function createRoom(
  gameType: GameType,
  hostSessionId: string,
  displayName: string
): Promise<Room> {
  const engine = getEngine(gameType);
  const code = generateRoomCode();

  const room: Room = {
    code,
    gameType,
    hostSessionId,
    status: 'waiting',
    players: [
      {
        sessionId: hostSessionId,
        displayName,
        createdAt: Date.now(),
        symbol: '',
      },
    ],
    spectators: [],
    createdAt: Date.now(),
    maxPlayers: engine.meta.maxPlayers,
    rematchRequests: [],
  };

  const key = `room:${code}`;
  const ttlSeconds = config.ROOM_TTL_MINUTES * 60;
  await redis.set(key, JSON.stringify(room), 'EX', ttlSeconds);

  return room;
}

/**
 * Retrieve a room from Redis by its code.
 * Returns null if the room doesn't exist or has expired.
 */
export async function getRoom(code: string): Promise<Room | null> {
  const key = `room:${code}`;
  const data = await redis.get(key);
  if (!data) return null;
  return JSON.parse(data) as Room;
}

/**
 * Persist a room to Redis, refreshing its TTL.
 * The room's code is used as the key.
 */
export async function updateRoom(room: Room): Promise<void> {
  const key = `room:${room.code}`;
  const ttlSeconds = config.ROOM_TTL_MINUTES * 60;
  await redis.set(key, JSON.stringify(room), 'EX', ttlSeconds);
}
