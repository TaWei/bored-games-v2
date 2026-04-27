import { describe, it, expect } from 'bun:test';
import { app } from './index';

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeString();
    expect(body.uptime).toBeNumber();
    expect(body.uptime).toBeGreaterThanOrEqual(0);
  });
});

describe('server startup config', () => {
  it('exports a default Bun.serve config with port, fetch, and websocket stub', async () => {
    const serverConfig = (await import('./index')).default;

    expect(serverConfig).toBeObject();
    expect(serverConfig.port).toBeNumber();
    expect(serverConfig.fetch).toBeFunction();
    expect(serverConfig.websocket).toBeObject();
    expect(serverConfig.websocket.open).toBeFunction();
    expect(serverConfig.websocket.message).toBeFunction();
    expect(serverConfig.websocket.close).toBeFunction();
  });

  it('fetch handler returns health response via Hono app', async () => {
    const serverConfig = (await import('./index')).default;

    const req = new Request('http://localhost/health');
    const res = await serverConfig.fetch(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
  });
});
