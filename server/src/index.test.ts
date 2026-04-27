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
