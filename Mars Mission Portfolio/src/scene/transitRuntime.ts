import { Vector3 } from "three";
import { AU_KM, DAY_MS, DAY_S } from "@/physics/constants";
import { type Elements, elementsFromState, propagate, stateFromElements } from "@/physics/kepler";
import { propellantFor } from "@/physics/rocketEquation";
import { PROPELLANT_KG, SHIP } from "@/physics/ship";
import { GM_SUN_KM, nextWindow, type Ephemeris, type Transfer } from "@/physics/transfer";
import type { Vec3 } from "@/physics/vec";
import { stations } from "@/content/stations";
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

export type StationStop = { index: number; tMs: number };

export const transit = {
  plan: null as Transfer | null,
  elements: null as Elements | null,
  /** Geocentric position at the departure burn, km. */
  burnPoint: new Vector3(),
  propellantKg: PROPELLANT_KG as number,
  shipHelioKm: new Vector3(),
  stops: [] as StationStop[],
};

export function planTransfer(fromMs: number): Transfer | null {
  transit.plan = nextWindow(fromMs, earthKm, marsKm, PARKING_RADIUS_KM);
  return transit.plan;
}

export function departureBurnPropellant(plan: Transfer): number {
  return propellantFor(plan.departBurn, SHIP.dryKg + transit.propellantKg, SHIP.ispS);
}

/** Commits to the planned transfer at the burn: fixes the heliocentric orbit and the station times. */
export function beginTransfer(burnPointKm: Vector3): void {
  const plan = transit.plan;
  if (!plan) return;
  const e = earthKm(plan.departMs);
  transit.elements = elementsFromState(e.r, plan.v1, GM_SUN_KM);
  transit.burnPoint.copy(burnPointKm);
  transit.propellantKg -= departureBurnPropellant(plan);
  const start = plan.departMs + DAY_MS;
  const end = plan.arriveMs - 3 * DAY_MS;
  transit.stops = stations.map((s, index) => ({ index, tMs: start + s.at * (end - start) }));
}

const vel = new Vector3();
const radial = new Vector3();
const xAxis = new Vector3();
const geo = new Vector3();
const target = new Vector3();

function smooth(x: number): number {
  const t = Math.min(Math.max(x, 0), 1);
  return t * t * (3 - 2 * t);
}

/**
 * Cruise: the sky layer switches to a ship centred frame in units of a
 * million km, so bodies hundreds of millions of km away keep full float
 * precision near the camera. frame.originKm is zero; everything in the sky
 * layer is placed relative to the ship.
 */
export function updateTransitFrame(simMs: number): void {
  const plan = transit.plan;
  const el = transit.elements;
  if (!plan || !el) return;
  const s = stateFromElements(propagate(el, GM_SUN_KM, (simMs - plan.departMs) / 1000), GM_SUN_KM);
  const earth = sky.helio.earth;
  const earthKmNow: Vec3 = [earth[0] * AU_KM, earth[1] * AU_KM, earth[2] * AU_KM];

  const blend = smooth((simMs - plan.departMs) / ESCAPE_BLEND_MS);
  if (blend < 1) {
    // Geocentric offset eases from the parking orbit onto the transfer, never below orbit height.
    target.set(s.r[0] - earthKmNow[0], s.r[1] - earthKmNow[1], s.r[2] - earthKmNow[2]);
    geo.copy(transit.burnPoint).lerp(target, blend);
    if (geo.length() < PARKING_RADIUS_KM) geo.setLength(PARKING_RADIUS_KM);
    transit.shipHelioKm.set(earthKmNow[0] + geo.x, earthKmNow[1] + geo.y, earthKmNow[2] + geo.z);
  } else {
    transit.shipHelioKm.set(...s.r);
  }

  vel.set(...s.v);
  frame.velocityKmS.copy(vel);
  radial.copy(transit.shipHelioKm).normalize();
  xAxis.copy(vel).addScaledVector(radial, -vel.dot(radial)).normalize();
  setFrameAxes(xAxis, radial);
  frame.originKm.set(0, 0, 0);
  frame.skyScaleKm = TRANSIT_UNIT_KM;

  const earthGap = distanceKm(transit.shipHelioKm, earthKmNow) - EARTH_RADIUS_KM;
  const m = sky.helio.mars;
  const marsGap = distanceKm(transit.shipHelioKm, [m[0] * AU_KM, m[1] * AU_KM, m[2] * AU_KM]) - MARS_RADIUS_KM;
  frame.skyNear = Math.min(Math.max((0.3 * Math.min(earthGap, marsGap)) / TRANSIT_UNIT_KM, 1e-7), 0.05);
}

function distanceKm(a: Vector3, b: Vec3): number {
  return Math.hypot(a.x - b[0], a.y - b[1], a.z - b[2]);
}

/** Ship position in AU, for the sky view. */
export function shipAu(): Vec3 {
  const p = transit.shipHelioKm;
  return [p.x / AU_KM, p.y / AU_KM, p.z / AU_KM];
}
