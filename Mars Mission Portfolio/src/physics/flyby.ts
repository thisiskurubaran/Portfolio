/**
 * Gravity assist in the patched conic model. Relative to the body the
 * flyby is a hyperbola: speed in equals speed out, and the direction turns
 * by delta = 2 asin(1 / e), with eccentricity e = 1 + rp v^2 / mu. The
 * change in velocity seen from outside is 2 v sin(delta / 2).
 */
export type Flyby = {
  /** Turn angle, radians. */
  turn: number;
  /** Size of the velocity change in the outside frame, km/s. */
  deltaV: number;
  eccentricity: number;
};

export function flyby(vInfKmS: number, periapsisKm: number, mu: number): Flyby {
  const e = 1 + (periapsisKm * vInfKmS * vInfKmS) / mu;
  const turn = 2 * Math.asin(1 / e);
  return { turn, deltaV: 2 * vInfKmS * Math.sin(turn / 2), eccentricity: e };
}
