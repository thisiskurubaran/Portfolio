import { Vector3 } from "three";
import { AU_KM } from "@/physics/constants";
import { type Elements, elementsFromState, orbitalPeriod, propagate, stateFromElements } from "@/physics/kepler";
import { hyperbolaState, type Hyperbola } from "@/physics/hyperbola";
import { propellantFor } from "@/physics/rocketEquation";
import { SHIP } from "@/physics/ship";
import type { Transfer } from "@/physics/transfer";
import { add, dot, length, scale, sub, type Vec3 } from "@/physics/vec";
import type { LandingSite } from "@/content/landingSites";
import { eclipticToScene } from "@/space/frames";
import { GM_MARS_KM, MARS_MOONS, MARS_RADIUS_KM, marsAxes, type MarsMoon } from "@/space/mars";
import { frame, setFrameAxes } from "./missionRuntime";
import { sky } from "./skyRuntime";
import { marsKm, transit } from "./transitRuntime";

/** Aerocapture pass: deep enough in the thin air to shed the excess speed, km above the datum. */
export const AEROCAPTURE_ALTITUDE_KM = 45;
/** Entry interface for landing, km above the datum. */
export const ENTRY_ALTITUDE_KM = 125;
/** Seconds either side of periapsis the drag pass lasts. */
export const AEROCAPTURE_HALF_S = 240;
/** Real seconds the apoapsis burn plays over. */
export const BURN_REAL_S = 5;
/** How far behind a moon the ship holds, km. */
const HOLD_BEHIND_KM = 35;

const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const unit = (a: Vec3): Vec3 => scale(a, 1 / length(a));

export type CaptureStep = "approach" | "aerocapture" | "coast" | "burn" | "done";

type Circular = { radius: number; /** Angle at epoch. */ phase0: number; epochMs: number };

export const mars = {
  hyperbola: null as Hyperbola | null,
  /** Periapsis of the approach, ms. */
  periMs: 0,
  /** In-plane axes of the approach, ecliptic: periapsis direction and the direction of motion there. */
  e1: [1, 0, 0] as Vec3,
  e2: [0, 1, 0] as Vec3,
  /** Orbit after the drag pass. */
  capture: null as Elements | null,
  apoMs: 0,
  /** Burn sizes, km/s. */
  aerocaptureDv: 0,
  insertionDv: 0,
  /** Equatorial basis for circular orbits: u toward apoapsis, w 90 degrees ahead. */
  u: [1, 0, 0] as Vec3,
  w: [0, 1, 0] as Vec3,
  pole: [0, 0, 1] as Vec3,
  moons: {} as Record<MarsMoon, Circular>,
  /** Where the ship is parked: which moon, or a transfer between them. */
  parked: "phobos" as MarsMoon,
  transfer: null as { elements: Elements; startMs: number; endMs: number; to: MarsMoon } | null,
  shipKm: new Vector3(),
  shipVelKmS: new Vector3(),
  landingSite: null as LandingSite | null,
};

function meanMotion(radiusKm: number): number {
  return Math.sqrt(GM_MARS_KM / radiusKm ** 3);
}

/** Position of a circular equatorial orbit at a time, Mars centred ecliptic km. */
function onCircle(c: Circular, ms: number): Vec3 {
  const a = c.phase0 + meanMotion(c.radius) * ((ms - c.epochMs) / 1000);
  return add(scale(mars.u, c.radius * Math.cos(a)), scale(mars.w, c.radius * Math.sin(a)));
}

function velocityOnCircle(c: Circular, ms: number): Vec3 {
  const a = c.phase0 + meanMotion(c.radius) * ((ms - c.epochMs) / 1000);
  const v = c.radius * meanMotion(c.radius);
  return add(scale(mars.u, -v * Math.sin(a)), scale(mars.w, v * Math.cos(a)));
}

export function moonPositionKm(id: MarsMoon, ms: number): Vec3 {
  return onCircle(mars.moons[id], ms);
}

/**
 * Plans the arrival from the transfer. The approach plane contains the
 * incoming excess velocity (that much is fixed by the transfer) and is
 * turned about it so that apoapsis of the capture orbit lands on Mars's
 * equator, at Phobos's orbital radius. One burn there then puts the ship
 * on Phobos's orbit, changing plane at the same time.
 */
export function planCapture(plan: Transfer): void {
  const marsNow = marsKm(plan.arriveMs);
  const vInfVec = sub(plan.v2, marsNow.v);
  const vInf = length(vInfVec);
  const d = unit(vInfVec);
  const h: Hyperbola = { rp: MARS_RADIUS_KM + AEROCAPTURE_ALTITUDE_KM, vInf, mu: GM_MARS_KM };
  const far = hyperbolaState(h, -1e9).v;
  const [ux, uy] = unit(far);
  const pole = marsAxes(plan.arriveMs).pole;

  // Periapsis makes angle acos(ux) with the incoming direction; choose its
  // azimuth about d so that apoapsis (opposite periapsis) is equatorial.
  const poleD = dot(pole, d);
  const perp = sub(pole, scale(d, poleD));
  const perpLen = length(perp);
  const a = scale(perp, 1 / perpLen);
  const b = cross(d, a);
  const sinAlpha = Math.sqrt(1 - ux! * ux!);
  const cosPhi = Math.min(Math.max((-ux! * poleD) / (sinAlpha * perpLen), -1), 1);
  let best: { e1: Vec3; e2: Vec3 } | null = null;
  for (const sign of [1, -1]) {
    const phi = sign * Math.acos(cosPhi);
    const p = add(scale(d, ux!), scale(add(scale(a, Math.cos(phi)), scale(b, Math.sin(phi))), sinAlpha));
    const e2 = unit(scale(sub(d, scale(p, ux!)), 1 / uy!));
    const n = cross(p, e2);
    // Prograde about Mars's pole, like the moons.
    if (!best || dot(n, pole) > 0) best = { e1: unit(p), e2 };
  }
  mars.hyperbola = h;
  mars.periMs = plan.arriveMs;
  mars.e1 = best!.e1;
  mars.e2 = best!.e2;
  mars.pole = pole;

  const rp = h.rp;
  const ra = MARS_MOONS.phobos.radiusKm;
  const peri = hyperbolaState(h, 0);
  const vpHyp = length(peri.v);
  const vpCapture = Math.sqrt(GM_MARS_KM * (2 / rp - 2 / (rp + ra)));
  mars.aerocaptureDv = vpHyp - vpCapture;
  const r0 = toEcliptic(peri.r);
  const v0 = scale(toEcliptic(peri.v), vpCapture / vpHyp);
  mars.capture = elementsFromState(r0, v0, GM_MARS_KM);
  mars.apoMs = mars.periMs + (orbitalPeriod(mars.capture.a, GM_MARS_KM) / 2) * 1000;

  // Equatorial basis anchored at apoapsis.
  const apo = stateFromElements(propagate(mars.capture, GM_MARS_KM, (mars.apoMs - mars.periMs) / 1000), GM_MARS_KM);
  mars.u = unit(sub(apo.r, scale(pole, dot(apo.r, pole))));
  mars.w = cross(pole, mars.u);
  const vTarget = scale(mars.w, Math.sqrt(GM_MARS_KM / ra));
  mars.insertionDv = length(sub(vTarget, apo.v));

  // Phobos is placed a little ahead of the ship at the burn, so the ship arrives trailing it.
  const lead = HOLD_BEHIND_KM / ra;
  mars.moons.phobos = { radius: ra, phase0: lead, epochMs: mars.apoMs };
  mars.moons.deimos = { radius: MARS_MOONS.deimos.radiusKm, phase0: 0, epochMs: mars.apoMs };
  mars.parked = "phobos";
  mars.transfer = null;
}

function toEcliptic(p: Vec3): Vec3 {
  return add(scale(mars.e1, p[0]), scale(mars.e2, p[1]));
}

export function captureStep(ms: number): CaptureStep {
  if (ms < mars.periMs - AEROCAPTURE_HALF_S * 1000) return "approach";
  if (ms < mars.periMs + AEROCAPTURE_HALF_S * 1000) return "aerocapture";
  if (ms < mars.apoMs) return "coast";
  return "burn";
}

export function burnPropellant(dvKmS: number): number {
  return propellantFor(dvKmS, SHIP.dryKg + transit.propellantKg, SHIP.ispS);
}

export function canAfford(dvKmS: number): boolean {
  return burnPropellant(dvKmS) <= transit.propellantKg;
}

/** Spends propellant for a burn of this size. */
export function spend(dvKmS: number): void {
  transit.propellantKg = Math.max(0, transit.propellantKg - burnPropellant(dvKmS));
}

/** Hohmann transfer between the two moons' orbits, from wherever the ship is parked. */
export function hohmannToMoon(to: MarsMoon): { dv1: number; dv2: number; hours: number } {
  const r1 = mars.moons[mars.parked].radius;
  const r2 = mars.moons[to].radius;
  const at = (r1 + r2) / 2;
  const v1 = Math.sqrt(GM_MARS_KM / r1);
  const v2 = Math.sqrt(GM_MARS_KM / r2);
  return {
    dv1: Math.abs(v1 * (Math.sqrt((2 * r2) / (r1 + r2)) - 1)),
    dv2: Math.abs(v2 * (1 - Math.sqrt((2 * r1) / (r1 + r2)))),
    hours: (Math.PI * Math.sqrt(at ** 3 / GM_MARS_KM)) / 3600,
  };
}

/** Starts the transfer now; the target moon is placed so it is waiting at arrival. */
export function startTransfer(to: MarsMoon, ms: number): void {
  const { dv1, dv2, hours } = hohmannToMoon(to);
  spend(dv1 + dv2);
  const from = mars.moons[mars.parked];
  const r = shipOnCircle(mars.parked, ms);
  const v = scale(unit(velocityOnCircle(from, ms)), Math.sqrt(GM_MARS_KM / from.radius) + Math.sign(mars.moons[to].radius - from.radius) * dv1);
  const elements = elementsFromState(r, v, GM_MARS_KM);
  const endMs = ms + hours * 3600 * 1000;
  // Arrival point is opposite the departure point; the moon waits just ahead of it.
  const arrive = stateFromElements(propagate(elements, GM_MARS_KM, (endMs - ms) / 1000), GM_MARS_KM).r;
  const target = mars.moons[to];
  const angle = Math.atan2(dot(arrive, mars.w), dot(arrive, mars.u));
  target.epochMs = endMs;
  target.phase0 = angle + HOLD_BEHIND_KM / target.radius;
  mars.transfer = { elements, startMs: ms, endMs, to };
}

/** Ship trailing a moon on its orbit. */
function shipOnCircle(id: MarsMoon, ms: number): Vec3 {
  const c = mars.moons[id];
  return onCircle({ ...c, phase0: c.phase0 - HOLD_BEHIND_KM / c.radius }, ms);
}

/** Deorbit burn from the current circular orbit to an orbit grazing the entry interface. */
export function deorbitDv(): number {
  const r = mars.moons[mars.parked].radius;
  const rp = MARS_RADIUS_KM + ENTRY_ALTITUDE_KM;
  const vc = Math.sqrt(GM_MARS_KM / r);
  const va = Math.sqrt(GM_MARS_KM * (2 / r - 2 / (r + rp)));
  return vc - va;
}

const vel = new Vector3();
const radial = new Vector3();
const xAxis = new Vector3();

/**
 * Mars centred flight: the sky layer is Mars centred in Mars radii, like
 * the Earth phases in Earth radii. The approach and capture orbit are
 * exact two-body paths; the drag pass swaps one for the other at
 * periapsis, with the speed it removes reported.
 */
export function updateMarsFrame(ms: number, phase: "capture" | "marsOrbit"): void {
  let r: Vec3;
  let v: Vec3;
  if (phase === "capture" && ms < mars.periMs && mars.hyperbola) {
    const s = hyperbolaState(mars.hyperbola, (ms - mars.periMs) / 1000);
    r = toEcliptic(s.r);
    v = toEcliptic(s.v);
  } else if (phase === "capture" && ms < mars.apoMs && mars.capture) {
    const s = stateFromElements(propagate(mars.capture, GM_MARS_KM, (ms - mars.periMs) / 1000), GM_MARS_KM);
    r = s.r;
    v = s.v;
  } else if (mars.transfer && ms < mars.transfer.endMs) {
    const s = stateFromElements(
      propagate(mars.transfer.elements, GM_MARS_KM, (ms - mars.transfer.startMs) / 1000),
      GM_MARS_KM,
    );
    r = s.r;
    v = s.v;
  } else {
    if (mars.transfer && ms >= mars.transfer.endMs) {
      mars.parked = mars.transfer.to;
      mars.transfer = null;
    }
    r = shipOnCircle(mars.parked, ms);
    v = velocityOnCircle(mars.moons[mars.parked], ms);
  }
  mars.shipKm.set(...r);
  mars.shipVelKmS.set(...v);

  frame.velocityKmS.set(...eclipticToScene(v));
  vel.copy(frame.velocityKmS);
  radial.set(...eclipticToScene(r)).normalize();
  xAxis.copy(vel).addScaledVector(radial, -vel.dot(radial)).normalize();
  setFrameAxes(xAxis, radial);
  frame.originKm.set(...eclipticToScene(r));
  frame.skyScaleKm = MARS_RADIUS_KM;

  const gaps = [length(r) - MARS_RADIUS_KM];
  for (const id of ["phobos", "deimos"] as const) {
    if (mars.moons[id]) gaps.push(length(sub(r, moonPositionKm(id, ms))) - MARS_MOONS[id].sizeKm[0]);
  }
  frame.skyNear = Math.min(Math.max((0.3 * Math.min(...gaps)) / MARS_RADIUS_KM, 1e-6), 0.05);
}

/** Ship position in AU, heliocentric, for the sky view. */
export function shipAuAtMars(): Vec3 {
  const m = sky.helio.mars;
  return [m[0] + mars.shipKm.x / AU_KM, m[1] + mars.shipKm.y / AU_KM, m[2] + mars.shipKm.z / AU_KM];
}

/** Whether the ship is in Mars's shadow (cylinder model). */
export function inMarsShadow(): boolean {
  const p = eclipticToScene([mars.shipKm.x, mars.shipKm.y, mars.shipKm.z]);
  const s = sky.view.sunDir;
  const along = p[0] * s.x + p[1] * s.y + p[2] * s.z;
  if (along > 0) return false;
  return p[0] ** 2 + p[1] ** 2 + p[2] ** 2 - along * along < MARS_RADIUS_KM ** 2;
}
