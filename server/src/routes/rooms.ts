import { Hono } from 'hono';
import { z } from 'zod';
import { isGameType } from '@bored-games/shared';
import { createRoom, getRoom, joinRoom } from '../services/room-manager';

const roomsRouter = new Hono();

const createRoomSchema = z.object({
  gameType: z.string(),
  hostSessionId: z.string().min(1),
  displayName: z.string().min(1),
});

const joinRoomSchema = z.object({
  sessionId: z.string().min(1),
  displayName: z.string().min(1),
});

roomsRouter.get('/', (c) => {
  return c.json({ rooms: [] });
});

roomsRouter.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = createRoomSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'Invalid request body' }, 400);
    }

    const { gameType, hostSessionId, displayName } = parsed.data;

    if (!isGameType(gameType)) {
      return c.json({ error: `Unknown game type: ${gameType}` }, 400);
    }

    const room = await createRoom(gameType, hostSessionId, displayName);
    return c.json({ roomCode: room.code, room }, 201);
  } catch {
    return c.json({ error: 'Internal server error' }, 500);
  }
});

roomsRouter.get('/:code', async (c) => {
  try {
    const code = c.req.param('code');
    const room = await getRoom(code);
    if (!room) {
      return c.json({ error: 'Room not found' }, 404);
    }
    return c.json({ room }, 200);
  } catch {
    return c.json({ error: 'Internal server error' }, 500);
  }
});

roomsRouter.post('/:code/join', async (c) => {
  try {
    const code = c.req.param('code');
    const body = await c.req.json();
    const parsed = joinRoomSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'Invalid request body' }, 400);
    }

    const { sessionId, displayName } = parsed.data;
    const room = await joinRoom(code, sessionId, displayName);

    // Find the player's symbol
    const player = room.players.find(p => p.sessionId === sessionId);
    const symbol = player?.symbol ?? '';

    return c.json({ room, symbol }, 200);
  } catch (err: any) {
    const message = err?.message ?? '';
    if (message === 'Room not found') {
      return c.json({ error: 'Room not found' }, 404);
    }
    if (message === 'Room is full') {
      return c.json({ error: 'Room is full' }, 409);
    }
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export { roomsRouter };
