import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { routes } from './routes/index';
import { config } from './lib/config';
import { validateWsParams } from './ws/handler';

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

// WebSocket upgrade endpoint — validates params, delegates to Hono for error responses
app.get('/ws', (c) => {
  const room = c.req.query('room');
  const sessionId = c.req.query('sessionId');
  const result = validateWsParams(room ?? null, sessionId ?? null);
  if (!result.ok) {
    return c.text(result.error, 400);
  }
  // In Bun.serve fetch wrapper, the actual upgrade happens before Hono.
  // When reached via app.request() (tests), return 200.
  return c.text('OK', 200);
});

console.log(`🚀 Server started on http://localhost:${config.PORT}`);

export { app };

export default {
  port: config.PORT,
  fetch(req: Request, server: any) {
    const url = new URL(req.url);
    // Handle WebSocket upgrades before Hono
    if (url.pathname === '/ws') {
      const room = url.searchParams.get('room');
      const sessionId = url.searchParams.get('sessionId');
      const result = validateWsParams(room, sessionId);
      if (!result.ok) {
        return new Response(result.error, { status: 400 });
      }
      server.upgrade(req, {
        data: { room: room!, sessionId: sessionId! },
      });
      return; // Bun completes the upgrade
    }
    return app.fetch(req);
  },
  websocket: {
    open(ws) { console.log('[ws] connection opened'); },
    message(ws, msg) { console.log('[ws] message:', msg); },
    close(ws) { console.log('[ws] connection closed'); },
  },
};
