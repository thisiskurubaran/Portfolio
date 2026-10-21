import { daysSinceJ2000, toRad } from "./time";

/**
 * Mars's solar longitude (Ls), the angle that marks its seasons: 0 is the
 * northern spring equinox, 90 the northern summer solstice. From Allison
 * and McEwen (2000), the algorithm behind NASA's Mars24, without the small
 * planetary perturbation terms (under 0.01 degrees).
 */
export function marsLs(ms: number): number {
  // TT runs about 69 s ahead of UTC; at Mars's pace that is 0.0004 degrees.
  const dt = daysSinceJ2000(ms);
  const m = toRad(19.3871 + 0.52402073 * dt);
  const alphaFms = 270.3871 + 0.524038496 * dt;
  const eoc =
    (10.691 + 3.0e-7 * dt) * Math.sin(m) +
    0.623 * Math.sin(2 * m) +
    0.05 * Math.sin(3 * m) +
    0.005 * Math.sin(4 * m) +
    0.0005 * Math.sin(5 * m);
  return (((alphaFms + eoc) % 360) + 360) % 360;
}

/**
 * Mars year count as planetary scientists use it (Clancy et al. 2000):
 * year 1 began on 11 April 1955. A Mars year is 686.97 days.
 */
export function marsYear(ms: number): number {
  const start = Date.UTC(1955, 3, 11);
  return 1 + Math.floor((ms - start) / (686.9726 * 86_400_000));
}

export type Season = "spring" | "summer" | "autumn" | "winter";

/** Northern hemisphere season from a solar longitude in degrees. */
export function northernSeason(ls: number): Season {
  return (["spring", "summer", "autumn", "winter"] as const)[Math.floor((((ls % 360) + 360) % 360) / 90)]!;
}

/**
 * The dusty half of the Mars year, Ls 180 to 360: southern spring and
 * summer, with Mars near perihelion. Regional storms are common, and the
 * planet-wide storms of 2001, 2007 and 2018 all began in it.
 */
export function marsDustSeason(ls: number): boolean {
  return ls >= 180;
}
