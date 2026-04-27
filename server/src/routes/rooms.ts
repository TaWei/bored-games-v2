import { Hono } from 'hono';

const roomsRouter = new Hono();

roomsRouter.get('/', (c) => {
  return c.json({ rooms: [] });
});

export { roomsRouter };
