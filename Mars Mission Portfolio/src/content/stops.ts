import type { StationModel } from "./stations";

/**
 * Waypoint stops between Earth and Mars. Unlike the stations on the
 * transfer arc, a stop is a real place the ship only passes when the
 * departure geometry allows: the Moon has to be near the escape path, and
 * L2 has to lie roughly along it. When a stop is on the path, its content
 * cluster moves there from the transfer stations.
 */
export type StopId = "moon" | "l2" | "phobos" | "deimos";

export type HighlightRef = { company: string; title: string; highlight: number };

export type Stop = {
  id: StopId;
  /** Which part of the flight the stop belongs to. */
  leg: "earth" | "mars";
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
  /** What sits next to the ship at the stop; none when the body itself is the sight. */
  model?: StationModel & { kind: "station" | "observatory" };
  /** Plain facts about the body, shown with the stop. */
  facts?: readonly string[];
};

export const stops: readonly Stop[] = [
  {
    id: "moon",
    leg: "earth",
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
    leg: "earth",
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
  {
    id: "phobos",
    leg: "mars",
    name: "Phobos",
    what: "Mars's larger moon, and the first stop after capture. A station in its orbit holds the featured project.",
    reference: "9,376 km from the centre of Mars, about 6,000 km above the surface",
    availability: "always",
    maxAngleDeg: 180,
    absorbs: ["instant-eats"],
    action: "Dock",
    model: { kind: "station", modules: 4, arrays: 2, ring: true, accent: "#ff7a6b" },
    facts: [
      "About 27 by 22 by 18 km, dark and cratered.",
      "Goes around Mars about three times a day, faster than Mars turns, so from the ground it rises in the west.",
      "Its orbit shrinks by about 2 m a century; in 30 to 50 million years it will break up or hit Mars.",
    ],
  },
  {
    id: "deimos",
    leg: "mars",
    name: "Deimos",
    what: "Mars's smaller, outer moon. A quiet place to look back at Mars.",
    reference: "23,463 km from the centre of Mars, about 20,000 km above the surface",
    availability: "always",
    maxAngleDeg: 180,
    absorbs: [],
    action: "Inspect",
    facts: [
      "About 15 by 12 by 11 km.",
      "Takes 30.3 hours to go around Mars.",
      "A deep layer of dust smooths over most of its craters.",
    ],
  },
];
