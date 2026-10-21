import { hiddenEntries } from "./hidden";
import { about, contact } from "./profile";
import { projects } from "./projects";
import type { Entry, VesselEntry } from "./types";
import { wrecks } from "./wrecks";

export const entries: VesselEntry[] = [...projects, about, contact];

export { hiddenEntries, wrecks };

/** Any entry by id, including the hidden ones found by playing. */
export function findEntry(id: string | null): Entry | undefined {
  if (!id) return undefined;
  return [...entries, ...hiddenEntries, ...wrecks].find((e) => e.id === id);
}
