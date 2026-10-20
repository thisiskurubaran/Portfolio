/** Ship type hints at what is on board. */
export type ShipKind = "fishing" | "cargo" | "sailboat" | "rowboat";

export type Link = { label: string; href: string };

export type Media =
  | { kind: "image"; src: string; alt: string; width: number; height: number }
  | { kind: "video"; src: string; poster?: string; alt: string };

/** Ships afloat, plus wrecks on the seabed (F17). */
export type EntryKind = ShipKind | "wreck";

/** Everything one ship carries. The panel and the plain site both render from this. */
export type Entry = {
  id: string;
  kind: EntryKind;
  title: string;
  /** A few words shown next to the ship when the beam finds it. */
  tag: string;
  summary: string;
  role?: string;
  stack?: string[];
  links: Link[];
  media: Media[];
  /** F17: what went wrong and what was learned, for abandoned projects. */
  lessons?: { wentWrong: string; learned: string };
};

/** An entry drawn as a vessel on the water, so it has a hull model. */
export type VesselEntry = Entry & { kind: ShipKind };
