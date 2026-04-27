import { Redis } from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379/0";

export const redis = new Redis(REDIS_URL);
export const redisSub = new Redis(REDIS_URL);

export const CHANNELS = {
  ROOM: (code: string) => `room:${code}`,
} as const;
