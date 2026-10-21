import { useStore } from "@/state/store";
import { mars } from "./marsRuntime";
import { transit, type Visit } from "./transitRuntime";

/** Mars orbit visits, in the order the visitor chose them. */
export const marsVisits: Visit[] = [];

/** The visit list for the current part of the flight. */
export function currentVisits(): Visit[] {
  const phase = useStore.getState().phase;
  if (phase === "transit") return transit.visits;
  if (phase === "marsOrbit") return marsVisits;
  return [];
}

export function resetMarsVisits(): void {
  marsVisits.length = 0;
  marsVisits.push({ id: "phobos", kind: "stop", stop: "phobos", tMs: mars.apoMs });
}
