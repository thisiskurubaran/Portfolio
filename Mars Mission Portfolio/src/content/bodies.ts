import type { PlanetId } from "@/space/elements";

export type BodyFacts = {
  name: string;
  /** Mean radius in km. */
  radiusKm: number;
  /** Sidereal orbital period in Earth days. */
  periodDays: number;
  /** Length of a solar day, as text since the units vary. */
  day: string;
  /** Brightness at 1 AU from Sun and observer, full phase (V(1,0)). */
  absMag: number;
  note: string;
};

/** Values from NASA's planetary fact sheets. */
export const bodies: Record<PlanetId, BodyFacts> = {
  mercury: {
    name: "Mercury",
    radiusKm: 2439.7,
    periodDays: 87.969,
    day: "176 Earth days",
    absMag: -0.6,
    note: "Smallest planet, and the closest to the Sun.",
  },
  venus: {
    name: "Venus",
    radiusKm: 6051.8,
    periodDays: 224.701,
    day: "117 Earth days",
    absMag: -4.47,
    note: "Hottest surface in the solar system, under clouds of sulphuric acid.",
  },
  earth: {
    name: "Earth",
    radiusKm: 6371.0,
    periodDays: 365.256,
    day: "24 h",
    absMag: -3.99,
    note: "Home. The only planet known to have liquid water on its surface.",
  },
  mars: {
    name: "Mars",
    radiusKm: 3389.5,
    periodDays: 686.98,
    day: "24 h 40 min",
    absMag: -1.52,
    note: "The destination. Surface gravity is 3.72 m/s², about 38% of Earth's.",
  },
  jupiter: {
    name: "Jupiter",
    radiusKm: 69_911,
    periodDays: 4332.59,
    day: "9 h 56 min",
    absMag: -9.4,
    note: "More than twice the mass of every other planet combined.",
  },
  saturn: {
    name: "Saturn",
    radiusKm: 58_232,
    periodDays: 10_759.22,
    day: "10 h 34 min",
    absMag: -8.88,
    note: "Its rings are mostly water ice and, in most places, under a kilometre thick.",
  },
  uranus: {
    name: "Uranus",
    radiusKm: 25_362,
    periodDays: 30_688.5,
    day: "17 h 14 min",
    absMag: -7.19,
    note: "Tilted 98 degrees, so it rolls around the Sun on its side.",
  },
  neptune: {
    name: "Neptune",
    radiusKm: 24_622,
    periodDays: 60_195,
    day: "16 h 6 min",
    absMag: -6.87,
    note: "Winds reach about 2,000 km/h, the fastest measured on any planet.",
  },
};
