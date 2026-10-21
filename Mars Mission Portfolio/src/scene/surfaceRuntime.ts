import { Vector3 } from "three";
import { AU_KM } from "@/physics/constants";
import type { Vec3 } from "@/physics/vec";
import type { LandingSite } from "@/content/landingSites";
import { eclipticToScene } from "@/space/frames";
import { heliocentric } from "@/space/elements";
import { MARS_RADIUS_KM, marsAxes } from "@/space/mars";
import { frame, setFrameAxes } from "./missionRuntime";
import { sky } from "./skyRuntime";

/**
 * Entry, descent and landing, in real seconds from the start of the
 * sequence. Entry, parachute and powered descent follow the shape of real
 * Mars landings (Perseverance: about 7 minutes from 125 km), compressed:
 * the one scripted part of the landing. Times are in real seconds.
 */
export const EDL = {
  deorbit: 0,
  entry: 3,
  parachute: 12,
  powered: 18,
  touchdown: 25,
} as const;

export type EdlStep = keyof typeof EDL;

export function edlStep(t: number): EdlStep {
  if (t < EDL.entry) return "deorbit";
  if (t < EDL.parachute) return "entry";
  if (t < EDL.powered) return "parachute";
  if (t < EDL.touchdown) return "powered";
  return "touchdown";
}

/** Altitude above the site, km, during the descent. */
export function edlAltitudeKm(t: number): number {
  if (t < EDL.entry) return 125;
  if (t < EDL.parachute) {
    const s = (t - EDL.entry) / (EDL.parachute - EDL.entry);
    // Entry sheds most of the height early, then flattens out as drag builds.
    return 10 + 115 * Math.pow(1 - s, 2.2);
  }
  if (t < EDL.powered) {
    const s = (t - EDL.parachute) / (EDL.powered - EDL.parachute);
    return 10 - 8.5 * s;
  }
  if (t < EDL.touchdown) {
    const s = (t - EDL.powered) / (EDL.touchdown - EDL.powered);
    // Powered descent slows to a hover just above the ground.
    return 1.5 * Math.pow(1 - s, 2);
  }
  return 0;
}

/** Speed during the descent, km/s, for the HUD. */
export function edlSpeedKmS(t: number): number {
  if (t < EDL.entry) return 3.6;
  if (t < EDL.parachute) return 0.45 + 5.1 * Math.pow(1 - (t - EDL.entry) / (EDL.parachute - EDL.entry), 1.5);
  if (t < EDL.powered) return 0.45 - 0.37 * ((t - EDL.parachute) / (EDL.powered - EDL.parachute));
  if (t < EDL.touchdown) return 0.08 * (1 - (t - EDL.powered) / (EDL.touchdown - EDL.powered));
  return 0;
}

export const surface = {
  site: null as LandingSite | null,
  /** Wall clock time the descent began, ms. */
  startedAt: 0,
  altitudeKm: 0,
  /** Site axes in scene coordinates: east, up, south. */
  east: new Vector3(1, 0, 0),
  up: new Vector3(0, 1, 0),
  /** Rover position on the terrain, metres east and south of the landing point. */
  rover: new Vector3(),
};

const upV = new Vector3();
const eastV = new Vector3();

/** Up and east at the site, Mars centred scene axes, as Mars turns. */
function siteAxes(site: LandingSite, ms: number): void {
  const ax = marsAxes(ms);
  const lat = (site.latDeg * Math.PI) / 180;
  const lon = (site.lonDeg * Math.PI) / 180;
  const c = Math.cos(lat);
  const u: Vec3 = [0, 1, 2].map(
    (k) => c * Math.cos(lon) * ax.lon0[k]! + c * Math.sin(lon) * ax.lon90e[k]! + Math.sin(lat) * ax.pole[k]!,
  ) as Vec3;
  const e: Vec3 = [0, 1, 2].map((k) => -Math.sin(lon) * ax.lon0[k]! + Math.cos(lon) * ax.lon90e[k]!) as Vec3;
  upV.set(...eclipticToScene(u)).normalize();
  eastV.set(...eclipticToScene(e)).normalize();
}

/** The frame for descent and surface: fixed to the turning ground at the site. */
export function updateSurfaceFrame(ms: number, altitudeKm: number): void {
  const site = surface.site;
  if (!site) return;
  siteAxes(site, ms);
  surface.altitudeKm = altitudeKm;
  surface.east.copy(eastV);
  surface.up.copy(upV);
  setFrameAxes(eastV, upV);
  frame.originKm.copy(upV).multiplyScalar(MARS_RADIUS_KM + altitudeKm + (site.elevationKm ?? 0));
  frame.velocityKmS.set(0, 0, 0);
  frame.skyScaleKm = MARS_RADIUS_KM;
  // Mars itself is not drawn at the surface, so the near plane only needs to keep the moons sharp.
  frame.skyNear = Math.min(Math.max((0.3 * Math.max(altitudeKm, 0.5)) / MARS_RADIUS_KM, 1e-6), 0.05);
}

/** Crew position in AU, heliocentric, for the sky view. */
export function surfaceAu(): Vec3 {
  const m = sky.helio.mars;
  const p = frame.originKm;
  // frame.originKm is in scene axes; undo the axis swap back to ecliptic.
  return [m[0] + p.x / AU_KM, m[1] - p.z / AU_KM, m[2] + p.y / AU_KM];
}

/** Sine of the Sun's elevation at a site on Mars. */
export function sunElevationSin(site: LandingSite, ms: number): number {
  const ax = marsAxes(ms);
  const lat = (site.latDeg * Math.PI) / 180;
  const lon = (site.lonDeg * Math.PI) / 180;
  const c = Math.cos(lat);
  const p = heliocentric("mars", ms).r;
  const d = Math.hypot(p[0], p[1], p[2]);
  let dot = 0;
  for (let k = 0; k < 3; k++) {
    const u = c * Math.cos(lon) * ax.lon0[k]! + c * Math.sin(lon) * ax.lon90e[k]! + Math.sin(lat) * ax.pole[k]!;
    dot += (u * -p[k]!) / d;
  }
  return dot;
}

/** A Mars solar day, ms. */
const SOL_MS = 88_775_244;

/**
 * Landers time entry so they touch down in daylight, with the Sun well up
 * for cameras and solar power. Returns the first time, from now, that the
 * Sun at the site climbs through about 30 degrees in the morning.
 */
export function nextMorning(site: LandingSite, fromMs: number): number {
  const target = Math.sin((30 * Math.PI) / 180);
  const step = 60_000 * 5;
  let prev = sunElevationSin(site, fromMs);
  for (let t = fromMs + step; t < fromMs + SOL_MS * 1.05; t += step) {
    const e = sunElevationSin(site, t);
    if (prev < target && e >= target) return t;
    prev = e;
  }
  return fromMs;
}
