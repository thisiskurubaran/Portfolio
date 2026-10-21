import type { Vec3 } from "./vec";

/** Classical elements. Angles in radians, a in AU. */
export type Elements = {
  a: number;
  e: number;
  /** Inclination. */
  i: number;
  /** Mean longitude. */
  L: number;
  /** Longitude of perihelion (Omega + argument of perihelion). */
  varpi: number;
  /** Longitude of the ascending node. */
  Omega: number;
};

export type State = { r: Vec3; v: Vec3 };

const TWO_PI = 2 * Math.PI;

function wrapPi(x: number): number {
  const y = (((x + Math.PI) % TWO_PI) + TWO_PI) % TWO_PI;
  return y - Math.PI;
}

/** Eccentric anomaly from mean anomaly, for elliptic orbits (e < 1). */
export function solveKepler(M: number, e: number): number {
  const m = wrapPi(M);
  // Starting at M + e sin M converges in a few steps for every planet; the
  // pi guess is safer for eccentric transfer orbits.
  let E = e < 0.8 ? m + e * Math.sin(m) : Math.PI * Math.sign(m || 1);
  for (let k = 0; k < 30; k++) {
    const f = E - e * Math.sin(E) - m;
    const dE = f / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < 1e-14) break;
  }
  return E;
}

export function orbitalPeriod(a: number, mu: number): number {
  return TWO_PI * Math.sqrt((a * a * a) / mu);
}

/** Position and velocity in the reference frame of the elements (AU, AU/day). */
export function stateFromElements(el: Elements, mu: number): State {
  const { a, e, i, L, varpi, Omega } = el;
  const w = varpi - Omega;
  const E = solveKepler(L - varpi, e);
  const cosE = Math.cos(E);
  const sinE = Math.sin(E);
  const b = a * Math.sqrt(1 - e * e);

  const xp = a * (cosE - e);
  const yp = b * sinE;
  const Edot = Math.sqrt(mu / (a * a * a)) / (1 - e * cosE);
  const vxp = -a * sinE * Edot;
  const vyp = b * cosE * Edot;

  const cw = Math.cos(w);
  const sw = Math.sin(w);
  const cO = Math.cos(Omega);
  const sO = Math.sin(Omega);
  const ci = Math.cos(i);
  const si = Math.sin(i);

  // Rotate out of the orbital plane: by w, then i, then Omega.
  const rot = (x: number, y: number): Vec3 => [
    (cw * cO - sw * sO * ci) * x + (-sw * cO - cw * sO * ci) * y,
    (cw * sO + sw * cO * ci) * x + (-sw * sO + cw * cO * ci) * y,
    sw * si * x + cw * si * y,
  ];
  return { r: rot(xp, yp), v: rot(vxp, vyp) };
}

/**
 * Two-body propagation: advance the mean longitude by n dt with other
 * elements fixed. dt uses the same time unit as mu.
 */
export function propagate(el: Elements, mu: number, dt: number): Elements {
  const n = Math.sqrt(mu / (el.a * el.a * el.a));
  return { ...el, L: el.L + n * dt };
}

// Below this, eccentricity or the node line is treated as undefined and the
// matching angle is measured from the reference axis instead.
const EPS = 1e-10;

/**
 * Elements from a position and velocity, for elliptic orbits. The inverse
 * of stateFromElements, including the circular and equatorial cases where
 * the periapsis or node direction does not exist.
 */
export function elementsFromState(r: Vec3, v: Vec3, mu: number): Elements {
  const rLen = Math.hypot(...r);
  const v2 = v[0] * v[0] + v[1] * v[1] + v[2] * v[2];
  const h: Vec3 = [r[1] * v[2] - r[2] * v[1], r[2] * v[0] - r[0] * v[2], r[0] * v[1] - r[1] * v[0]];
  const hLen = Math.hypot(...h);
  const hHat: Vec3 = [h[0] / hLen, h[1] / hLen, h[2] / hLen];

  const a = 1 / (2 / rLen - v2 / mu);
  const vxh: Vec3 = [v[1] * h[2] - v[2] * h[1], v[2] * h[0] - v[0] * h[2], v[0] * h[1] - v[1] * h[0]];
  const ev: Vec3 = [vxh[0] / mu - r[0] / rLen, vxh[1] / mu - r[1] / rLen, vxh[2] / mu - r[2] / rLen];
  const e = Math.hypot(...ev);
  const i = Math.acos(Math.min(Math.max(hHat[2], -1), 1));

  // Node line: z cross h. For an equatorial orbit it vanishes and x is used.
  const nLen = Math.hypot(h[0], h[1]);
  const p: Vec3 = nLen / hLen > EPS ? [-h[1] / nLen, h[0] / nLen, 0] : [1, 0, 0];
  const Omega = nLen / hLen > EPS ? Math.atan2(p[1], p[0]) : 0;
  const q: Vec3 = [
    hHat[1] * p[2] - hHat[2] * p[1],
    hHat[2] * p[0] - hHat[0] * p[2],
    hHat[0] * p[1] - hHat[1] * p[0],
  ];
  const inPlane = (x: Vec3) => Math.atan2(x[0] * q[0] + x[1] * q[1] + x[2] * q[2], x[0] * p[0] + x[1] * p[1] + x[2] * p[2]);

  const u = inPlane(r);
  const w = e > EPS ? inPlane(ev) : 0;
  const nu = u - w;
  const E = 2 * Math.atan2(Math.sqrt(1 - e) * Math.sin(nu / 2), Math.sqrt(1 + e) * Math.cos(nu / 2));
  const M = E - e * Math.sin(E);
  const varpi = Omega + w;
  return { a, e, i, L: varpi + M, varpi, Omega };
}
