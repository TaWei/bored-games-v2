import { Hono } from 'hono';
import { listGames, getEngine } from '@bored-games/shared/src/games/registry';

const gamesRouter = new Hono();

gamesRouter.get('/', (c) => {
  return c.json({ games: listGames() });
});

gamesRouter.get('/:type', (c) => {
  const type = c.req.param('type');
  try {
    const engine = getEngine(type as any);
    return c.json(engine.meta);
  } catch {
    return c.json({ error: 'Game type not found' }, 404);
  }
});

export { gamesRouter };
