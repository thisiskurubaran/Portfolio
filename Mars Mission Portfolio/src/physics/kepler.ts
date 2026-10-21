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

/** Two-body propagation: advance the mean longitude by n dt with other elements fixed. */
export function propagate(el: Elements, mu: number, dtDays: number): Elements {
  const n = Math.sqrt(mu / (el.a * el.a * el.a));
  return { ...el, L: el.L + n * dtDays };
}
