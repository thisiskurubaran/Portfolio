/**
 * Real landing sites and candidates. Coordinates are planetocentric,
 * east positive. Elevations are relative to the Mars reference datum where
 * the mission teams published them.
 */
export type LandingSite = {
  id: string;
  name: string;
  latDeg: number;
  lonDeg: number;
  elevationKm?: number;
  note: string;
};

export const landingSites: readonly LandingSite[] = [
  {
    id: "jezero",
    name: "Jezero crater",
    latDeg: 18.44,
    lonDeg: 77.45,
    elevationKm: -2.6,
    note: "An ancient lake with a river delta, where Perseverance landed in 2021.",
  },
  {
    id: "gale",
    name: "Gale crater",
    latDeg: -4.59,
    lonDeg: 137.44,
    elevationKm: -4.5,
    note: "Layered rock around Mount Sharp, explored by Curiosity since 2012.",
  },
  {
    id: "utopia",
    name: "Utopia Planitia",
    latDeg: 25.07,
    lonDeg: 109.93,
    note: "A vast northern plain where Viking 2 landed in 1976 and Zhurong in 2021.",
  },
  {
    id: "arcadia",
    name: "Arcadia Planitia",
    latDeg: 40,
    lonDeg: -160,
    note: "Flat, low northern plains with water ice close to the surface, studied as a site for crews.",
  },
];
