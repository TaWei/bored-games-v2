import { describe, test, expect, afterAll } from "bun:test";
import { redis, redisSub, CHANNELS } from "./redis";

describe("Redis client", () => {
  afterAll(async () => {
    await redis.quit();
    await redisSub.quit();
  });

  test("redis.ping() returns PONG", async () => {
    const result = await redis.ping();
    expect(result).toBe("PONG");
  });

  test("redisSub is a separate connection", () => {
    expect(redisSub).not.toBe(redis);
  });

  test("CHANNELS.ROOM formats room channel name", () => {
    expect(CHANNELS.ROOM("ABC123")).toBe("room:ABC123");
  });
});
