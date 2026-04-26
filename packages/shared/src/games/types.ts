import type { GameType, GameMeta } from '../types';

/**
 * Generic Result type for fallible operations.
 *
 * A discriminated union: `ok: true` yields a value of type T,
 * `ok: false` yields an error of type E.
 *
 * This is the return type for GameEngine.reduce() and other
 * operations that may fail.
 */
export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

/**
 * The core interface every game engine must implement.
 *
 * Type parameters:
 * - S: Game state (must extend BaseGameState conceptually, enforced by tests)
 * - C: Game config (initialization parameters, e.g., board size)
 * - E: Game event (union type of all legal moves/actions)
 * - V: Game view (what a specific player can see — may differ from state for hidden-info games)
 *
 * All methods are pure: no side effects, no I/O, no randomness.
 * This enables deterministic replay of game history (Principle 5).
 */
export interface GameEngine<S, C, E, V> {
  /** Discriminated game type string (e.g., 'tic-tac-toe', 'chess') */
  readonly gameType: GameType;

  /** Player count constraints for this game */
  readonly playerCount: { readonly min: number; readonly max: number };

  /** Human-readable metadata for lobby display */
  readonly meta: GameMeta;

  /**
   * Initialize a new game state from config and ordered player IDs.
   * The first player ID is the starting player.
   */
  init(config: C, playerIds: readonly string[]): S;

  /**
   * Apply an event to the game state, returning a new state on success
   * or an error on failure. This is the core state transition.
   * Must be pure and immutable — returns a new state, never mutates.
   */
  reduce(state: S, event: E): Result<S, string>;

  /**
   * Return all legal events for a given player in the current state.
   * Empty array means no legal moves for that player.
   */
  legalEvents(state: S, playerId: string): readonly E[];

  /**
   * Check if the game has ended. Returns null if still ongoing,
   * or a result with winner (null for draws) and end reason.
   */
  checkEnd(state: S): { readonly winner: string | null; readonly reason: string } | null;

  /**
   * Compute what a specific player can see. For perfect-information
   * games this is the full state. For hidden-information games
   * (e.g., poker, werewolf) this filters out what others can't see.
   */
  view(state: S, playerId: string): V;
}
