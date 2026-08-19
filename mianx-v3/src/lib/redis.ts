import { Redis } from "@upstash/redis";

let _redis: Redis | null = null;

function createRedis(): Redis {
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return _redis;
}

const redisProxy = new Proxy({} as Redis, {
  get(_target, prop) {
    return (createRedis() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export default redisProxy;
