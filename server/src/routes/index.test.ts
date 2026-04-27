import { test, expect } from 'bun:test';
import { app } from '../index';

test('GET /api/games returns 200 with tic-tac-toe in games array', async () => {
  const res = await app.request('/api/games');
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.games).toBeDefined();
  const ttt = body.games.find((g: any) => g.gameType === 'tic-tac-toe');
  expect(ttt).toBeDefined();
  expect(ttt.name).toBe('Tic-Tac-Toe');
  expect(ttt.minPlayers).toBe(2);
  expect(ttt.maxPlayers).toBe(2);
});

test('GET /api/rooms returns 200 with empty rooms array', async () => {
  const res = await app.request('/api/rooms');
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body).toEqual({ rooms: [] });
});
