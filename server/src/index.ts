import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { routes } from './routes/index';
import { config } from './lib/config';

// Side-effect import: registers all game engines in the registry
import '@bored-games/shared/src/games';

const app = new Hono();
const startTime = Date.now();

app.use('*', cors());
app.use('*', logger());

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: (Date.now() - startTime) / 1000,
  });
});

app.route('/api', routes);

console.log(`🚀 Server started on http://localhost:${config.PORT}`);

export { app };

export default {
  port: config.PORT,
  fetch: app.fetch,
  websocket: {
    open(ws) { console.log('[ws] connection opened'); },
    message(ws, msg) { console.log('[ws] message:', msg); },
    close(ws) { console.log('[ws] connection closed'); },
  },
};
