/**
 * All supported game types in bored-games v2.
 * Each game type corresponds to a game engine in packages/shared/src/games/.
 *
 * This is a discriminated union — every game type must be listed here.
 */
export type GameType = 'tic-tac-toe';

/**
 * Type guard to check if a string is a valid GameType.
 */
export function isGameType(value: string): value is GameType {
  return value === 'tic-tac-toe';
}
