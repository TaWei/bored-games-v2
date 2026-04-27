import { describe, it, expect } from 'bun:test';
import { createConfig, config } from './config';
import type { Config } from './config';

// Helper to create config from a partial env subset
function cfg(env: Record<string, string | undefined> = {}): Config {
  return createConfig(env);
}

describe('createConfig defaults', () => {
  const c = cfg({});

  it('default PORT is 3000', () => {
    expect(c.PORT).toBe(3000);
  });

  it('default NODE_ENV is "development"', () => {
    expect(c.NODE_ENV).toBe('development');
  });

  it('default isDevelopment is true when NODE_ENV is not production', () => {
    expect(c.isDevelopment).toBe(true);
  });

  it('default REDIS_URL is redis://localhost:6379/0', () => {
    expect(c.REDIS_URL).toBe('redis://localhost:6379/0');
  });

  it('default DATABASE_URL is postgresql://localhost:5432/bored_games', () => {
    expect(c.DATABASE_URL).toBe('postgresql://localhost:5432/bored_games');
  });

  it('default ROOM_TTL_MINUTES is 30', () => {
    expect(c.ROOM_TTL_MINUTES).toBe(30);
  });

  it('ROOM_TTL_MINUTES is a number type', () => {
    expect(typeof c.ROOM_TTL_MINUTES).toBe('number');
  });
});

describe('config with NODE_ENV=production', () => {
  const c = cfg({ NODE_ENV: 'production' });

  it('isDevelopment is false', () => {
    expect(c.isDevelopment).toBe(false);
  });

  it('NODE_ENV is "production"', () => {
    expect(c.NODE_ENV).toBe('production');
  });
});

describe('config with custom env vars', () => {
  const c = cfg({
    PORT: '8080',
    NODE_ENV: 'staging',
    REDIS_URL: 'redis://custom-redis:6379/1',
    DATABASE_URL: 'postgresql://custom-db:5432/my_db',
    ROOM_TTL_MINUTES: '45',
  });

  it('reads custom PORT', () => {
    expect(c.PORT).toBe(8080);
  });

  it('reads custom NODE_ENV', () => {
    expect(c.NODE_ENV).toBe('staging');
  });

  it('isDevelopment is true for non-production custom NODE_ENV', () => {
    expect(c.isDevelopment).toBe(true);
  });

  it('reads custom REDIS_URL', () => {
    expect(c.REDIS_URL).toBe('redis://custom-redis:6379/1');
  });

  it('reads custom DATABASE_URL', () => {
    expect(c.DATABASE_URL).toBe('postgresql://custom-db:5432/my_db');
  });

  it('reads custom ROOM_TTL_MINUTES as number', () => {
    expect(c.ROOM_TTL_MINUTES).toBe(45);
    expect(typeof c.ROOM_TTL_MINUTES).toBe('number');
  });
});

describe('config singleton from process.env', () => {
  it('is an object', () => {
    expect(typeof config).toBe('object');
  });

  it('has PORT as number', () => {
    expect(typeof config.PORT).toBe('number');
  });

  it('has NODE_ENV as string', () => {
    expect(typeof config.NODE_ENV).toBe('string');
  });

  it('has isDevelopment as boolean', () => {
    expect(typeof config.isDevelopment).toBe('boolean');
  });

  it('has REDIS_URL as string', () => {
    expect(typeof config.REDIS_URL).toBe('string');
  });

  it('has DATABASE_URL as string', () => {
    expect(typeof config.DATABASE_URL).toBe('string');
  });

  it('has ROOM_TTL_MINUTES as number', () => {
    expect(typeof config.ROOM_TTL_MINUTES).toBe('number');
  });
});
