import { test, expect } from 'bun:test';
import { app } from '../index';

test('GET /api/games returns 200 with empty games array', async () => {
  const res = await app.request('/api/games');
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body).toEqual({ games: [] });
});

test('GET /api/rooms returns 200 with empty rooms array', async () => {
  const res = await app.request('/api/rooms');
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body).toEqual({ rooms: [] });
});
