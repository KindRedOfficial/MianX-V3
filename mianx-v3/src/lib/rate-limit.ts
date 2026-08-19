import redis from "./redis";
import { AuthError } from "./auth-session";

/**
 * Sliding-window rate limiter using Upstash Redis.
 * Allows `limit` requests per `windowMs` milliseconds per key.
 * Throws 429 if the limit is exceeded.
 */
export async function rateLimit({
  key,
  limit = 20,
  windowMs = 60_000,
}: {
  key: string;
  limit?: number;
  windowMs?: number;
}): Promise<void> {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Use a sorted-set approach: add current timestamp, remove old entries, count
  const multi = redis.multi();
  multi.zadd(key, { score: now, member: `${now}-${Math.random()}` });
  multi.zremrangebyscore(key, 0, windowStart);
  multi.zcard(key);
  multi.expireat(key, Math.floor((now + windowMs) / 1000));

  const results = await multi.exec();
  const count = results?.[2] as number;

  if (count > limit) {
    throw new AuthError(
      `Rate limit exceeded: ${limit} requests per ${windowMs / 1000}s window`,
      429,
    );
  }
}
