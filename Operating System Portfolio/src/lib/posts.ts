import type { z } from "zod";
import { getStore } from "./store";

export const collections = {
  guestbook: { key: "kbos:guestbook", max: 200 },
  stickies: { key: "kbos:stickies", max: 40 },
} as const;
export type CollectionName = keyof typeof collections;

export const isCollection = (name: string): name is CollectionName => name in collections;

export async function listPosts<T extends { id: string }>(name: CollectionName, schema: z.ZodType<T>, count = 50): Promise<T[]> {
  const store = getStore();
  if (!store) return [];
  const raw = await store.listRange(collections[name].key, count);
  // Anything that no longer matches the schema is skipped, never rendered.
  return raw.flatMap((r) => {
    try {
      const parsed = schema.safeParse(typeof r === "string" ? JSON.parse(r) : r);
      return parsed.success ? [parsed.data] : [];
    } catch {
      return [];
    }
  });
}

export async function addPost(name: CollectionName, post: { id: string }) {
  const store = getStore();
  if (!store) throw new Error("no store");
  await store.listPush(collections[name].key, JSON.stringify(post), collections[name].max);
}

export async function removePost(name: CollectionName, id: string): Promise<boolean> {
  const store = getStore();
  if (!store) return false;
  const raw = await store.listRange(collections[name].key, collections[name].max);
  const match = raw.find((r) => {
    try {
      return (typeof r === "string" ? JSON.parse(r) : r).id === id;
    } catch {
      return false;
    }
  });
  if (!match) return false;
  return (await store.listRemove(collections[name].key, typeof match === "string" ? match : JSON.stringify(match))) > 0;
}
