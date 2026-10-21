/**
 * Distance from the smaller body to its L1 or L2 point, to first order in
 * the mass ratio: r = a * cbrt(m / 3M). For the Sun and Earth with the Moon
 * this gives about 1.5 million km, where SOHO (L1) and JWST (L2) sit.
 */
export function hillRadius(semiMajorAxisKm: number, gmSmall: number, gmLarge: number): number {
  return semiMajorAxisKm * Math.cbrt(gmSmall / (3 * gmLarge));
}
