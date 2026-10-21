import type { Vec3 } from "./vec";

/** Stumpff functions C(z) and S(z), with series near zero where the closed forms lose precision. */
function stumpffC(z: number): number {
  if (z > 1e-6) return (1 - Math.cos(Math.sqrt(z))) / z;
  if (z < -1e-6) return (Math.cosh(Math.sqrt(-z)) - 1) / -z;
  return 1 / 2 - z / 24 + (z * z) / 720;
}

function stumpffS(z: number): number {
  if (z > 1e-6) {
    const s = Math.sqrt(z);
    return (s - Math.sin(s)) / (s * s * s);
  }
  if (z < -1e-6) {
    const s = Math.sqrt(-z);
    return (Math.sinh(s) - s) / (s * s * s);
  }
  return 1 / 6 - z / 120 + (z * z) / 5040;
}

export type LambertResult = { v1: Vec3; v2: Vec3 };

/**
 * Lambert's problem: the orbit that goes from r1 to r2 in time dt. Universal
 * variable form (Curtis, Orbital Mechanics for Engineering Students,
 * algorithm 5.2), single revolution, prograde. Units follow mu.
 *
 * Returns null when no prograde single revolution solution exists, such as
 * for a transfer of almost exactly 180 degrees, where the plane is undefined.
 */
export function lambert(r1: Vec3, r2: Vec3, dt: number, mu: number): LambertResult | null {
  const r1n = Math.hypot(...r1);
  const r2n = Math.hypot(...r2);
  const crossZ = r1[0] * r2[1] - r1[1] * r2[0];
  const cosTheta = Math.min(Math.max((r1[0] * r2[0] + r1[1] * r2[1] + r1[2] * r2[2]) / (r1n * r2n), -1), 1);
  let theta = Math.acos(cosTheta);
  if (crossZ < 0) theta = 2 * Math.PI - theta;

  const A = Math.sin(theta) * Math.sqrt((r1n * r2n) / (1 - cosTheta));
  if (!Number.isFinite(A) || Math.abs(A) < 1e-12) return null;

  const y = (z: number) => r1n + r2n + (A * (z * stumpffS(z) - 1)) / Math.sqrt(stumpffC(z));
  const F = (z: number) => {
    const yz = y(z);
    return Math.pow(yz / stumpffC(z), 1.5) * stumpffS(z) + A * Math.sqrt(yz) - Math.sqrt(mu) * dt;
  };

  // F rises with z on the single revolution branch, so bisection is safe.
  // The lower bound is the smallest z with y(z) > 0.
  let lo = -4 * Math.PI * Math.PI;
  let hi = 4 * Math.PI * Math.PI - 1e-9;
  while (y(lo) < 0 && lo < hi) lo += 0.1;
  if (y(lo) < 0) return null;
  if (F(lo) > 0 || F(hi) < 0) return null;
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    if (F(mid) > 0) hi = mid;
    else lo = mid;
    if (hi - lo < 1e-12) break;
  }
  const z = (lo + hi) / 2;
  const yz = y(z);
  const f = 1 - yz / r1n;
  const g = A * Math.sqrt(yz / mu);
  const gdot = 1 - yz / r2n;
  return {
    v1: [(r2[0] - f * r1[0]) / g, (r2[1] - f * r1[1]) / g, (r2[2] - f * r1[2]) / g],
    v2: [(gdot * r2[0] - r1[0]) / g, (gdot * r2[1] - r1[1]) / g, (gdot * r2[2] - r1[2]) / g],
  };
}
