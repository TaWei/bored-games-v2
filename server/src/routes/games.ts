import { Hono } from 'hono';
import { listGames } from '@bored-games/shared/src/games/registry';

const gamesRouter = new Hono();

gamesRouter.get('/', (c) => {
  return c.json({ games: listGames() });
});

export { gamesRouter };
