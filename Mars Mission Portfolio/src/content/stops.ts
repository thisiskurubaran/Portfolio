import type { StationModel } from "./stations";

/**
 * Waypoint stops between Earth and Mars. Unlike the stations on the
 * transfer arc, a stop is a real place the ship only passes when the
 * departure geometry allows: the Moon has to be near the escape path, and
 * L2 has to lie roughly along it. When a stop is on the path, its content
 * cluster moves there from the transfer stations.
 */
export type StopId = "moon" | "l2";

export type HighlightRef = { company: string; title: string; highlight: number };

export type Stop = {
  id: StopId;
  name: string;
  /** What is there. */
  what: string;
  /** The real orbital reference, in plain words. */
  reference: string;
  /** Always on the way, or only when the departure geometry allows. */
  availability: "always" | "geometry";
  /** Largest angle between the escape path and the stop, as seen from Earth, that still counts as passing it. */
  maxAngleDeg: number;
  /** Stations whose content this stop takes over when the ship visits it. */
  absorbs: readonly string[];
  /** For the L2 stop: picks from the roles' highlights. */
  highlights?: readonly HighlightRef[];
  /** What docking is called here. */
  action: string;
  model: StationModel & { kind: "station" | "observatory" };
};

export const stops: readonly Stop[] = [
  {
    id: "moon",
    name: "The Moon",
    what: "A small station in lunar orbit. First steps: where the education and early roles are kept.",
    reference: "Lunar orbit, 384,400 km from Earth on average",
    availability: "geometry",
    maxAngleDeg: 40,
    absorbs: ["education", "early"],
    action: "Dock",
    model: { kind: "station", modules: 2, arrays: 1, accent: "#cfd6e0" },
  },
  {
    id: "l2",
    name: "Sun-Earth L2",
    what: "The cold side of Earth, away from the Sun, where deep space observatories park. Holds the technical highlights: the hardest problems solved so far.",
    reference: "1.5 million km from Earth, straight away from the Sun",
    availability: "geometry",
    maxAngleDeg: 50,
    absorbs: [],
    highlights: [
      { company: "ProdEx Technologies", title: "Software Engineer III", highlight: 0 },
      { company: "ProdEx Technologies", title: "Software Engineer III", highlight: 2 },
      { company: "ProdEx Technologies", title: "Software Engineer II", highlight: 0 },
      { company: "Santan Infotech Pvt. Ltd.", title: "Technical Team Lead", highlight: 1 },
      { company: "Santan Infotech Pvt. Ltd.", title: "Technical Team Lead", highlight: 2 },
    ],
    action: "Rendezvous",
    model: { kind: "observatory", modules: 0, arrays: 0, accent: "#ffd76b" },
  },
];
