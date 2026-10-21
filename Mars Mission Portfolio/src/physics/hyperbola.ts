import type { Vec3 } from "./vec";

/**
 * Hyperbolic flyby or approach in its own plane: periapsis on +x, motion
 * toward +y at periapsis. Time is measured from periapsis (negative before
 * it). Units follow mu.
 */
export type Hyperbola = {
  /** Periapsis radius. */
  rp: number;
  /** Hyperbolic excess speed. */
  vInf: number;
  mu: number;
};

export function eccentricity(h: Hyperbola): number {
  return 1 + (h.rp * h.vInf * h.vInf) / h.mu;
}

/** Speed at periapsis: escape speed there plus the excess, combined in quadrature. */
export function periapsisSpeed(h: Hyperbola): number {
  return Math.sqrt(h.vInf * h.vInf + (2 * h.mu) / h.rp);
}

/** In-plane position and velocity at time t from periapsis. */
export function hyperbolaState(h: Hyperbola, t: number): { r: Vec3; v: Vec3 } {
  const e = eccentricity(h);
  const a = -h.mu / (h.vInf * h.vInf);
  const n = Math.sqrt(h.mu / -(a * a * a));
  const M = n * t;
  // Kepler's equation for hyperbolas: M = e sinh H - H.
  let H = Math.asinh(M / e);
  for (let i = 0; i < 50; i++) {
    const f = e * Math.sinh(H) - H - M;
    const dH = f / (e * Math.cosh(H) - 1);
    H -= dH;
    if (Math.abs(dH) < 1e-13) break;
  }
  const b = -a * Math.sqrt(e * e - 1);
  const x = a * (Math.cosh(H) - e);
  const y = b * Math.sinh(H);
  const Hdot = n / (e * Math.cosh(H) - 1);
  return {
    r: [x, y, 0],
    v: [a * Math.sinh(H) * Hdot, b * Math.cosh(H) * Hdot, 0],
  };
}

/** Angle between the incoming asymptote direction and periapsis, radians. */
export function asymptoteAngle(h: Hyperbola): number {
  return Math.acos(-1 / eccentricity(h));
}
