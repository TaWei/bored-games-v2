import { test, expect } from 'bun:test';
import { app } from '../index';

test('GET /api/games/tic-tac-toe returns 200 with game meta', async () => {
  const res = await app.request('/api/games/tic-tac-toe');
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.gameType).toBe('tic-tac-toe');
  expect(body.name).toBe('Tic-Tac-Toe');
  expect(body.minPlayers).toBe(2);
  expect(body.maxPlayers).toBe(2);
  expect(body.slug).toBe('tic-tac-toe');
});

test('GET /api/games/chess returns 404 for unknown game type', async () => {
  const res = await app.request('/api/games/chess');
  expect(res.status).toBe(404);
});

test('GET /api/games/nonexistent returns 404', async () => {
  const res = await app.request('/api/games/nonexistent');
  expect(res.status).toBe(404);
});
