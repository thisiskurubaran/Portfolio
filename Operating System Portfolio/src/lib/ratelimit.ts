import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env, hasRedis } from "./env";
import { getStore } from "./store";

export interface LimitResult {
  ok: boolean;
  retryAfter: number;
}

const limiters = new Map<string, Ratelimit>();

// Upstash Ratelimit in production; a fixed window on the fallback store otherwise.
export async function rateLimit(name: string, id: string, max: number, windowSeconds: number): Promise<LimitResult> {
  if (hasRedis()) {
    const key = `${name}:${max}:${windowSeconds}`;
    let limiter = limiters.get(key);
    if (!limiter) {
      limiter = new Ratelimit({
        redis: new Redis({ url: env.redisUrl!, token: env.redisToken! }),
        limiter: Ratelimit.slidingWindow(max, `${windowSeconds} s`),
        prefix: `kbos:rl:${name}`,
      });
      limiters.set(key, limiter);
    }
    const r = await limiter.limit(id);
    return { ok: r.success, retryAfter: Math.max(0, Math.ceil((r.reset - Date.now()) / 1000)) };
  }
  const store = getStore();
  if (!store) return { ok: true, retryAfter: 0 };
  const count = await store.incr(`kbos:rl:${name}:${id}`, windowSeconds);
  return { ok: count <= max, retryAfter: count <= max ? 0 : windowSeconds };
}
