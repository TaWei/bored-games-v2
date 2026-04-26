import { describe, test, expect } from 'bun:test';
import { registerGame, getEngine, listGames } from './registry';
import type { GameEngine } from './types';

// Minimal engine for testing
type TestState = { readonly value: number };
type TestConfig = { readonly multiplier: number };
type TestEvent = { readonly type: 'INCREMENT'; readonly amount: number };
type TestView = { readonly displayValue: number };

const mockEngine: GameEngine<TestState, TestConfig, TestEvent, TestView> = {
  gameType: 'tic-tac-toe',
  playerCount: { min: 2, max: 2 },
  meta: {
    gameType: 'tic-tac-toe',
    name: 'Mock Game',
    description: 'For testing registry',
    minPlayers: 2,
    maxPlayers: 2,
    slug: 'mock',
    icon: '🧪',
  },
  init: (config, _playerIds) => ({ value: config.multiplier }),
  reduce: (state, _event) => ({ ok: true, value: state }),
  legalEvents: () => [],
  checkEnd: () => null,
  view: (state) => ({ displayValue: state.value }),
};

describe('GameRegistry', () => {
  test('registers an engine and retrieves it', () => {
    registerGame(mockEngine);
    const engine = getEngine('tic-tac-toe');
    expect(engine).toBeDefined();
    expect(engine.gameType).toBe('tic-tac-toe');
    expect(engine.meta.name).toBe('Mock Game');
  });

  test('listGames returns metadata for registered games', () => {
    registerGame(mockEngine);
    const games = listGames();
    expect(games).toHaveLength(1);
    expect(games[0].gameType).toBe('tic-tac-toe');
    expect(games[0].name).toBe('Mock Game');
    expect(games[0].icon).toBe('🧪');
  });

  test('throws for unknown game type', () => {
    expect(() => getEngine('chess')).toThrow('No engine registered');
  });

  test('registering same gameType overwrites previous', () => {
    const updatedEngine = { ...mockEngine, meta: { ...mockEngine.meta, name: 'Updated Mock' } };
    registerGame(mockEngine);
    registerGame(updatedEngine);
    const engine = getEngine('tic-tac-toe');
    expect(engine.meta.name).toBe('Updated Mock');
  });
});
