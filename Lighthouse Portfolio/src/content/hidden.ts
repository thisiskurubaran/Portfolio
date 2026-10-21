import { ghostShip } from "./ghost";
import type { VesselEntry } from "./types";

// Entries that are not on the water from the start. They are found by playing,
// and also listed on the plain site so nobody misses the content.

/** F09: opened when a visitor guides the boat in distress to the jetty. */
export const rescueReward: VesselEntry = {
  id: "rescued",
  kind: "fishing",
  title: "Thank you, keeper",
  tag: "Brought home safe",
  summary:
    "A hidden project or a thank you note for guiding the boat in through the storm. Replace this entry in src/content/hidden.ts.",
  links: [],
  media: [],
};

/** F06: wedged on the rocks, only reachable when the tide is low. */
export const lowTideFind: VesselEntry = {
  id: "low-tide",
  kind: "fishing",
  title: "Found at low water",
  tag: "Something on the rocks",
  summary: "A hidden project that only shows when the tide goes out. Replace this entry in src/content/hidden.ts.",
  links: [],
  media: [],
};

export const hiddenEntries: VesselEntry[] = [rescueReward, lowTideFind, ghostShip];
