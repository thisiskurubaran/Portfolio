"use client";

import { useEffect } from "react";
import { spaceWeatherSchema } from "@/space/spaceWeather";
import { useConditions } from "@/state/conditions";
import { conditionsSchema } from "@/weather/schema";

async function load<T>(url: string, parse: (v: unknown) => { success: true; data: T } | { success: false }): Promise<T | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    const parsed = parse(await res.json());
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/**
 * Fetches the pad weather and space weather once per visit. Both routes
 * answer even when the upstream feeds are down, and anything that fails
 * validation is dropped; the scene then runs on its quiet defaults.
 */
export function ConditionsLoader() {
  useEffect(() => {
    const { setConditions, setSpaceWeather } = useConditions.getState();
    void load("/api/conditions", (v) => conditionsSchema.safeParse(v)).then((c) => c && setConditions(c));
    void load("/api/spaceweather", (v) => spaceWeatherSchema.safeParse(v)).then((s) => s && setSpaceWeather(s));
  }, []);
  return null;
}
