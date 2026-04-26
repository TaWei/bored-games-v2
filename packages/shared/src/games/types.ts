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
