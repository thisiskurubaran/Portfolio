import { Vector3 } from "three";
import { AU_KM, DAY_MS, DAY_S } from "@/physics/constants";
import { type Elements, elementsFromState, propagate, type State, stateFromElements } from "@/physics/kepler";
import { type Flyby, flyby } from "@/physics/flyby";
import { hillRadius } from "@/physics/lagrange";
import { propellantFor } from "@/physics/rocketEquation";
import { PROPELLANT_KG, SHIP } from "@/physics/ship";
import { GM_EARTH_KM, GM_SUN_KM, nextWindow, type Ephemeris, type Transfer } from "@/physics/transfer";
import type { Vec3 } from "@/physics/vec";
import { stations } from "@/content/stations";
import { type StopId, stops } from "@/content/stops";
import { GM_MOON_KM, MOON_RADIUS_KM, moonGeocentric } from "@/space/moon";
import { heliocentric } from "@/space/elements";
import { frame, setFrameAxes } from "./missionRuntime";
import { sky } from "./skyRuntime";
import { EARTH_RADIUS_KM } from "./scale";

/** Sky layer units during the cruise: one unit is a million km. */
export const TRANSIT_UNIT_KM = 1e6;
export const MARS_RADIUS_KM = 3389.5;
export const PARKING_RADIUS_KM = EARTH_RADIUS_KM + 200;

/**
 * How long the escape from Earth takes to blend into the heliocentric
 * transfer. A real departure burn is aimed so the escape hyperbola leaves
 * along the transfer direction; this blend stands in for that aiming and
 * for the first trajectory correction, and is the one scripted part of the
 * cruise.
 */
const ESCAPE_BLEND_MS = 12 * 3600 * 1000;
/** Real seconds the departure burn plays over. */
export const TMI_REAL_S = 8;

const toKm =
  (id: "earth" | "mars"): Ephemeris =>
  (ms) => {
    const s = heliocentric(id, ms);
    return {
      r: [s.r[0] * AU_KM, s.r[1] * AU_KM, s.r[2] * AU_KM],
      v: [(s.v[0] * AU_KM) / DAY_S, (s.v[1] * AU_KM) / DAY_S, (s.v[2] * AU_KM) / DAY_S],
    };
  };
export const earthKm = toKm("earth");
export const marsKm = toKm("mars");

export type Visit =
  | { id: string; kind: "station"; station: number; tMs: number }
  | { id: string; kind: "stop"; stop: StopId; tMs: number };

export type StopStatus = {
  /** When the escape path reaches the stop's distance from Earth, or null if it never does. */
  tMs: number | null;
  /** Angle at Earth between the escape path and the stop, degrees. */
  angleDeg: number | null;
  available: boolean;
  /** Visited anyway, by override. */
  forced: boolean;
};

export const transit = {
  plan: null as Transfer | null,
  elements: null as Elements | null,
  /** Geocentric position at the departure burn, km. */
  burnPoint: new Vector3(),
  propellantKg: PROPELLANT_KG as number,
  shipHelioKm: new Vector3(),
  /** Stations and stops in the order the ship reaches them. */
  visits: [] as Visit[],
  stopStatus: {} as Record<StopId, StopStatus>,
  /** 0 on the transfer, 1 parked at the current stop. */
  anchorBlend: 0,
};

export function planTransfer(fromMs: number): Transfer | null {
  transit.plan = nextWindow(fromMs, earthKm, marsKm, PARKING_RADIUS_KM);
  return transit.plan;
}

export function departureBurnPropellant(plan: Transfer): number {
  return propellantFor(plan.departBurn, SHIP.dryKg + transit.propellantKg, SHIP.ispS);
}

function smooth(x: number): number {
  const t = Math.min(Math.max(x, 0), 1);
  return t * t * (3 - 2 * t);
}

/**
 * Ship position and velocity on the planned flight, km and km/s, before
 * any stop. Pure, so stop timing can be searched ahead of time.
 */
export function shipOnTransfer(ms: number): State {
  const plan = transit.plan!;
  const s = stateFromElements(propagate(transit.elements!, GM_SUN_KM, (ms - plan.departMs) / 1000), GM_SUN_KM);
  const blend = smooth((ms - plan.departMs) / ESCAPE_BLEND_MS);
  if (blend >= 1) return s;
  // Geocentric offset eases from the parking orbit onto the transfer, never below orbit height.
  const e = earthKm(ms).r;
  const g = transit.burnPoint.clone().lerp(new Vector3(s.r[0] - e[0], s.r[1] - e[1], s.r[2] - e[2]), blend);
  if (g.length() < PARKING_RADIUS_KM) g.setLength(PARKING_RADIUS_KM);
  return { r: [e[0] + g.x, e[1] + g.y, e[2] + g.z], v: s.v };
}

function geocentric(ms: number): Vec3 {
  const r = shipOnTransfer(ms).r;
  const e = earthKm(ms).r;
  return [r[0] - e[0], r[1] - e[1], r[2] - e[2]];
}

/** First time the ship is a given distance from Earth, within a month of departure. */
function timeAtDistance(km: number): number | null {
  const plan = transit.plan!;
  let lo = plan.departMs;
  let hi = plan.departMs + 30 * DAY_MS;
  if (Math.hypot(...geocentric(hi)) < km) return null;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (Math.hypot(...geocentric(mid)) < km) lo = mid;
    else hi = mid;
  }
  return hi;
}

function angleDeg(a: Vec3, b: Vec3): number {
  const c = (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / (Math.hypot(...a) * Math.hypot(...b));
  return (Math.acos(Math.min(Math.max(c, -1), 1)) * 180) / Math.PI;
}

export const L2_DISTANCE_KM = hillRadius(AU_KM, GM_EARTH_KM + GM_MOON_KM, GM_SUN_KM);

/** Where each stop really is, geocentric km, at a given time. */
function stopGeocentric(id: StopId, ms: number): Vec3 {
  if (id === "moon") return moonGeocentric(ms);
  const e = earthKm(ms).r;
  const d = Math.hypot(...e);
  return [(e[0] / d) * L2_DISTANCE_KM, (e[1] / d) * L2_DISTANCE_KM, (e[2] / d) * L2_DISTANCE_KM];
}

/** Checks each stop against the real escape path: is it passed close enough to visit? */
function gateStops(): void {
  for (const stop of stops) {
    const distance = stop.id === "moon" ? Math.hypot(...moonGeocentric(transit.plan!.departMs)) : L2_DISTANCE_KM;
    const t = timeAtDistance(distance);
    const angle = t === null ? null : angleDeg(geocentric(t), stopGeocentric(stop.id, t));
    transit.stopStatus[stop.id] = {
      tMs: t,
      angleDeg: angle,
      available: stop.availability === "always" || (angle !== null && angle <= stop.maxAngleDeg),
      forced: false,
    };
  }
}

/** Rebuilds the visit order from the stops on the path and the stations they leave over. */
export function buildVisits(): void {
  const plan = transit.plan!;
  const start = plan.departMs + DAY_MS;
  const end = plan.arriveMs - 3 * DAY_MS;
  const visiting = stops.filter((s) => {
    const st = transit.stopStatus[s.id];
    return st && st.tMs !== null && (st.available || st.forced);
  });
  const absorbed = new Set(visiting.flatMap((s) => s.absorbs));
  const list: Visit[] = [];
  stations.forEach((s, station) => {
    if (!absorbed.has(s.id)) list.push({ id: s.id, kind: "station", station, tMs: start + s.at * (end - start) });
  });
  for (const s of visiting) list.push({ id: s.id, kind: "stop", stop: s.id, tMs: transit.stopStatus[s.id].tMs! });
  transit.visits = list.sort((a, b) => a.tMs - b.tMs);
}

/** Commits to the planned transfer at the burn: fixes the heliocentric orbit and the visit times. */
export function beginTransfer(burnPointKm: Vector3): void {
  const plan = transit.plan;
  if (!plan) return;
  const e = earthKm(plan.departMs);
  transit.elements = elementsFromState(e.r, plan.v1, GM_SUN_KM);
  transit.burnPoint.copy(burnPointKm);
  transit.propellantKg -= departureBurnPropellant(plan);
  gateStops();
  buildVisits();
}

/**
 * Visit a stop the escape path does not pass. The ship is moved to it for
 * the visit and back afterwards; the HUD labels it as an override.
 */
export function forceStop(id: StopId): void {
  const st = transit.stopStatus[id];
  if (!st || st.tMs === null) return;
  st.forced = true;
  buildVisits();
}

const vel = new Vector3();
const radial = new Vector3();
const xAxis = new Vector3();
const bodyUp = new Vector3();

/**
 * Parking point at a stop: low lunar orbit over the sunlit side, leaning
 * toward the side the ship arrives from, or the L2 point itself.
 */
function anchorAt(id: StopId, ms: number, onTransfer: Vec3): Vec3 {
  const e = earthKm(ms).r;
  const g = stopGeocentric(id, ms);
  const body: Vec3 = [e[0] + g[0], e[1] + g[1], e[2] + g[2]];
  if (id !== "moon") return body;
  const approach: Vec3 = [onTransfer[0] - body[0], onTransfer[1] - body[1], onTransfer[2] - body[2]];
  const an = Math.hypot(...approach);
  const bn = Math.hypot(...body);
  // Twice as much weight on the Sun direction as on the approach, so the ground below is in daylight.
  const d: Vec3 = [0, 1, 2].map((k) => approach[k]! / an - (2 * body[k]!) / bn) as Vec3;
  const n = Math.hypot(...d);
  const r = MOON_RADIUS_KM + 200;
  return [body[0] + (d[0] / n) * r, body[1] + (d[1] / n) * r, body[2] + (d[2] / n) * r];
}

/**
 * Cruise: the sky layer switches to a ship centred frame in units of a
 * million km, so bodies hundreds of millions of km away keep full float
 * precision near the camera. frame.originKm is zero; everything in the sky
 * layer is placed relative to the ship.
 *
 * At a stop the ship eases from the transfer to a parking point and back:
 * the short cinematic framing on arrival. The transfer itself is untouched,
 * so leaving resumes it with the right velocity.
 */
export function updateTransitFrame(simMs: number, stopId: StopId | null, anchorBlend: number): void {
  const plan = transit.plan;
  if (!plan || !transit.elements) return;
  const s = shipOnTransfer(simMs);
  transit.anchorBlend = stopId ? anchorBlend : 0;
  if (stopId && anchorBlend > 0) {
    const a = anchorAt(stopId, simMs, s.r);
    const b = smooth(anchorBlend);
    transit.shipHelioKm.set(
      s.r[0] + (a[0] - s.r[0]) * b,
      s.r[1] + (a[1] - s.r[1]) * b,
      s.r[2] + (a[2] - s.r[2]) * b,
    );
  } else {
    transit.shipHelioKm.set(...s.r);
  }

  vel.set(...s.v);
  frame.velocityKmS.copy(vel);
  radial.copy(transit.shipHelioKm).normalize();
  if (stopId === "moon" && anchorBlend > 0) {
    // Parked over the Moon, "up" turns to point away from it, so it fills the view below.
    const e = earthKm(simMs).r;
    const g = moonGeocentric(simMs);
    bodyUp.set(transit.shipHelioKm.x - e[0] - g[0], transit.shipHelioKm.y - e[1] - g[1], transit.shipHelioKm.z - e[2] - g[2]);
    radial.lerp(bodyUp.normalize(), smooth(anchorBlend)).normalize();
  }
  xAxis.copy(vel).addScaledVector(radial, -vel.dot(radial)).normalize();
  setFrameAxes(xAxis, radial);
  frame.originKm.set(0, 0, 0);
  frame.skyScaleKm = TRANSIT_UNIT_KM;

  const e = sky.helio.earth;
  const earthKmNow: Vec3 = [e[0] * AU_KM, e[1] * AU_KM, e[2] * AU_KM];
  const moon = moonGeocentric(simMs);
  const m = sky.helio.mars;
  const gaps = [
    distanceKm(transit.shipHelioKm, earthKmNow) - EARTH_RADIUS_KM,
    distanceKm(transit.shipHelioKm, [earthKmNow[0] + moon[0], earthKmNow[1] + moon[1], earthKmNow[2] + moon[2]]) -
      MOON_RADIUS_KM,
    distanceKm(transit.shipHelioKm, [m[0] * AU_KM, m[1] * AU_KM, m[2] * AU_KM]) - MARS_RADIUS_KM,
  ];
  frame.skyNear = Math.min(Math.max((0.3 * Math.min(...gaps)) / TRANSIT_UNIT_KM, 1e-7), 0.05);
}

function distanceKm(a: Vector3, b: Vec3): number {
  return Math.hypot(a.x - b[0], a.y - b[1], a.z - b[2]);
}

/** Ship position in AU, for the sky view. */
export function shipAu(): Vec3 {
  const p = transit.shipHelioKm;
  return [p.x / AU_KM, p.y / AU_KM, p.z / AU_KM];
}

/** Distance from the ship to a stop's body or point, km. */
export function distanceToStop(id: StopId, ms: number): number {
  const e = earthKm(ms).r;
  const g = stopGeocentric(id, ms);
  return distanceKm(transit.shipHelioKm, [e[0] + g[0], e[1] + g[1], e[2] + g[2]]);
}

/** Lunar flyby at the Moon stop, from the escape velocity relative to the Moon there. */
export function moonFlyby(altitudeKm: number): (Flyby & { vInf: number }) | null {
  const t = transit.stopStatus.moon?.tMs;
  if (t == null) return null;
  const dt = 60_000;
  const a = geocentric(t - dt);
  const b = geocentric(t + dt);
  const ma = moonGeocentric(t - dt);
  const mb = moonGeocentric(t + dt);
  const v: Vec3 = [0, 1, 2].map((k) => (b[k]! - a[k]! - (mb[k]! - ma[k]!)) / ((2 * dt) / 1000)) as Vec3;
  const vInf = Math.hypot(...v);
  return { ...flyby(vInf, MOON_RADIUS_KM + altitudeKm, GM_MOON_KM), vInf };
}

/** Name of a visit, and its own word for docking where it has one. */
export function visitLabel(v: Visit): { name: string; action: string | null } {
  if (v.kind === "station") return { name: stations[v.station]!.name, action: null };
  const s = stops.find((x) => x.id === v.stop)!;
  return { name: s.name, action: s.action };
}
