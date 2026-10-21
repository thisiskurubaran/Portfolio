import { heliocentric } from "./elements";

export type EclipticPosition = {
  /** Ecliptic longitude in radians, J2000 frame. */
  lon: number;
  /** Distance in AU. */
  r: number;
};

/**
 * Geocentric Sun position, taken as the reverse of Earth's heliocentric
 * position. Using the same orbital elements as the planets keeps the Sun,
 * planets and stars in one frame (J2000) instead of mixing in the equinox
 * of date, which has precessed about 0.37 degrees since 2000.
 */
export function sunPosition(ms: number): EclipticPosition {
  const [x, y, z] = heliocentric("earth", ms).r;
  const lon = Math.atan2(-y, -x);
  return { lon: lon < 0 ? lon + 2 * Math.PI : lon, r: Math.hypot(x, y, z) };
}
