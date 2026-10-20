import type { Entry } from "./types";

// Entries that are not on the water from the start. They are found by playing,
// and also listed on the plain site so nobody misses the content.

/** F09: opened when a visitor guides the boat in distress to the jetty. */
export const rescueReward: Entry = {
  id: "rescued",
  kind: "fishing",
  title: "Thank you, keeper",
  tag: "Brought home safe",
  summary:
    "A hidden project or a thank you note for guiding the boat in through the storm. Replace this entry in src/content/hidden.ts.",
  links: [],
  media: [],
};

export const hiddenEntries: Entry[] = [rescueReward];
