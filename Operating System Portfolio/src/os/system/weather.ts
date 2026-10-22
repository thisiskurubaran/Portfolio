"use client";

import { useSyncExternalStore } from "react";
import type { Weather } from "./weatherTypes";

type State = { status: "idle" | "loading" | "done"; weather: Weather | null };

let state: State = { status: "idle", weather: null };
const listeners = new Set<() => void>();

function set(next: State) {
  state = next;
  listeners.forEach((l) => l());
}

// One request per page load, shared by every widget that shows the weather.
function load() {
  if (state.status !== "idle") return;
  set({ status: "loading", weather: null });
  const devSpot = process.env.NODE_ENV === "development" ? new URLSearchParams(window.location.search) : null;
  const query = devSpot?.has("lat") ? `?${devSpot.toString()}` : "";
  fetch(`/api/weather${query}`)
    .then((r) => (r.ok ? r.json() : { weather: null }))
    .then((data: { weather: Weather | null }) => set({ status: "done", weather: data.weather ?? null }))
    .catch(() => set({ status: "done", weather: null }));
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  load();
  return () => listeners.delete(cb);
}

const SERVER: State = { status: "idle", weather: null };

export function useWeather() {
  return useSyncExternalStore(subscribe, () => state, () => SERVER);
}
