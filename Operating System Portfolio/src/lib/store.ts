import { Redis } from "@upstash/redis";
import { env, hasRedis } from "./env";

// A small key-value layer over Upstash Redis. In development without Upstash
// keys it falls back to memory, which resets on restart. In production
// without keys there is no store, and writes are refused.
export interface Store {
  persistent: boolean;
  listPush(key: string, value: string, max: number, ttlSeconds?: number): Promise<void>;
  listRange(key: string, count: number): Promise<string[]>;
  listRemove(key: string, value: string): Promise<number>;
  incr(key: string, ttlSeconds: number): Promise<number>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
}

function redisStore(): Store {
  const redis = new Redis({ url: env.redisUrl!, token: env.redisToken!, automaticDeserialization: false });
  return {
    persistent: true,
    async listPush(key, value, max, ttlSeconds) {
      const p = redis.pipeline();
      p.lpush(key, value);
      p.ltrim(key, 0, max - 1);
      if (ttlSeconds) p.expire(key, ttlSeconds);
      await p.exec();
    },
    listRange: (key, count) => redis.lrange<string>(key, 0, count - 1),
    listRemove: (key, value) => redis.lrem(key, 0, value),
    async incr(key, ttlSeconds) {
      const p = redis.pipeline();
      p.incr(key);
      p.expire(key, ttlSeconds, "NX");
      const [count] = await p.exec<[number, number]>();
      return count;
    },
    get: (key) => redis.get<string>(key),
    async set(key, value, ttlSeconds) {
      await redis.set(key, value, { ex: ttlSeconds });
    },
  };
}

type Entry = { value: string | string[]; expires: number };

function memoryStore(): Store {
  const data = new Map<string, Entry>();
  const live = (key: string) => {
    const e = data.get(key);
    if (e && e.expires < Date.now()) {
      data.delete(key);
      return undefined;
    }
    return e;
  };
  const far = () => Date.now() + 365 * 86400_000;
  return {
    persistent: false,
    async listPush(key, value, max, ttlSeconds) {
      const e = live(key);
      const list = [value, ...((e?.value as string[]) ?? [])].slice(0, max);
      data.set(key, { value: list, expires: ttlSeconds ? Date.now() + ttlSeconds * 1000 : (e?.expires ?? far()) });
    },
    async listRange(key, count) {
      return ((live(key)?.value as string[]) ?? []).slice(0, count);
    },
    async listRemove(key, value) {
      const e = live(key);
      const list = (e?.value as string[]) ?? [];
      const next = list.filter((v) => v !== value);
      if (e) data.set(key, { ...e, value: next });
      return list.length - next.length;
    },
    async incr(key, ttlSeconds) {
      const e = live(key);
      const n = Number(e?.value ?? 0) + 1;
      data.set(key, { value: String(n), expires: e?.expires ?? Date.now() + ttlSeconds * 1000 });
      return n;
    },
    async get(key) {
      const v = live(key)?.value;
      return typeof v === "string" ? v : null;
    },
    async set(key, value, ttlSeconds) {
      data.set(key, { value, expires: Date.now() + ttlSeconds * 1000 });
    },
  };
}

// Module scope so the memory fallback survives between requests in one process.
let store: Store | null | undefined;

export function getStore(): Store | null {
  if (store === undefined) store = hasRedis() ? redisStore() : env.dev ? memoryStore() : null;
  return store;
}
