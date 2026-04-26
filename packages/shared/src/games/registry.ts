import type { GameType, GameMeta } from '../types';
import type { GameEngine } from './types';

/**
 * Global registry of game engines, keyed by GameType.
 *
 * Used by the server to dynamically look up engine implementations
 * when handling game-specific logic — there's no switch/case or
 * if/else chains on GameType elsewhere in the codebase (Principle 4).
 */
const registry = new Map<GameType, GameEngine<any, any, any, any>>();

/**
 * Register a game engine. Call during server startup.
 * If an engine with the same gameType already exists, it is overwritten.
 */
export function registerGame(engine: GameEngine<any, any, any, any>): void {
  registry.set(engine.gameType, engine);
}

/**
 * Retrieve a game engine by its game type.
 * Throws if no engine is registered for the given type.
 */
export function getEngine(gameType: GameType): GameEngine<any, any, any, any> {
  const engine = registry.get(gameType);
  if (!engine) {
    throw new Error(`No engine registered for game type "${gameType}"`);
  }
  return engine;
}

/**
 * List all registered games with their metadata.
 * Used by the GET /api/games endpoint and lobby UI.
 */
export function listGames(): GameMeta[] {
  const metas: GameMeta[] = [];
  for (const engine of registry.values()) {
    metas.push(engine.meta);
  }
  return metas;
}
