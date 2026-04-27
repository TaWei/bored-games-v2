import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

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

export { app };
