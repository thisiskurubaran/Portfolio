const MS_PER_DAY = 86_400_000;
const JD_UNIX_EPOCH = 2_440_587.5;

/** Julian date of J2000.0, the epoch most orbital elements are given for. */
export const J2000 = 2_451_545.0;

export function julianDate(ms: number): number {
  return ms / MS_PER_DAY + JD_UNIX_EPOCH;
}

/** Days since J2000.0. Ignores the UT/TT difference (about 69 s), well under what the scene can show. */
export function daysSinceJ2000(ms: number): number {
  return julianDate(ms) - J2000;
}

/** Greenwich mean sidereal time in radians, from the IAU 1982 linear term. */
export function gmst(ms: number): number {
  const deg = 280.46061837 + 360.98564736629 * daysSinceJ2000(ms);
  return toRad(((deg % 360) + 360) % 360);
}

export function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
