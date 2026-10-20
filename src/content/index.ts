import { hiddenEntries } from "./hidden";
import { about, contact } from "./profile";
import { projects } from "./projects";
import type { Entry } from "./types";

export const entries: Entry[] = [...projects, about, contact];

export { hiddenEntries };

/** Any entry by id, including the hidden ones found by playing. */
export function findEntry(id: string | null): Entry | undefined {
  return id ? (entries.find((e) => e.id === id) ?? hiddenEntries.find((e) => e.id === id)) : undefined;
}
