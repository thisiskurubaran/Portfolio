import { daysSinceJ2000, toRad } from "./time";

export type EclipticPosition = {
  /** Ecliptic longitude in radians. */
  lon: number;
  /** Distance in AU. */
  r: number;
};

/**
 * Geocentric Sun position from the Astronomical Almanac low precision
 * formula. Good to about 0.01 degrees between 1950 and 2050, which is far
 * finer than one pixel of the Sun disc in the scene.
 */
export function sunPosition(ms: number): EclipticPosition {
  const n = daysSinceJ2000(ms);
  const L = toRad(280.46 + 0.9856474 * n);
  const g = toRad(357.528 + 0.9856003 * n);
  const lon = L + toRad(1.915) * Math.sin(g) + toRad(0.02) * Math.sin(2 * g);
  const r = 1.00014 - 0.01671 * Math.cos(g) - 0.00014 * Math.cos(2 * g);
  return { lon: ((lon % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI), r };
}
