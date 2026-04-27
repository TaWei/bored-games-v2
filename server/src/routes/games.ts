import { Hono } from 'hono';

const gamesRouter = new Hono();

gamesRouter.get('/', (c) => {
  return c.json({ games: [] });
});

export { gamesRouter };
