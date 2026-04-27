export interface Config {
  PORT: number;
  NODE_ENV: string;
  isDevelopment: boolean;
  REDIS_URL: string;
  DATABASE_URL: string;
  ROOM_TTL_MINUTES: number;
}

/**
 * Create a typed config object from the given environment dictionary.
 * Falls back to sensible defaults for every key.
 */
export function createConfig(env: Record<string, string | undefined>): Config {
  const PORT = parseInt(env.PORT || '3000', 10);
  const NODE_ENV = env.NODE_ENV || 'development';
  const isDevelopment = NODE_ENV !== 'production';
  const REDIS_URL = env.REDIS_URL || 'redis://localhost:6379/0';
  const DATABASE_URL = env.DATABASE_URL || 'postgresql://localhost:5432/bored_games';
  const ROOM_TTL_MINUTES = parseInt(env.ROOM_TTL_MINUTES || '30', 10);

  return {
    PORT,
    NODE_ENV,
    isDevelopment,
    REDIS_URL,
    DATABASE_URL,
    ROOM_TTL_MINUTES,
  };
}

/**
 * Convenience singleton backed by process.env.
 */
export const config: Config = createConfig(process.env as Record<string, string | undefined>);
