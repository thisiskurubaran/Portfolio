import { Matrix4, Quaternion, Vector3 } from "three";
import { type Elements, elementsFromState, propagate, stateFromElements } from "@/physics/kepler";
import type { Vec3 } from "@/physics/vec";
import { LAUNCH_SITE, siteBodyVector } from "@/space/site";
import { EARTH_RADIUS_KM } from "./scale";
import { sky } from "./skyRuntime";
import { EVENTS, sampleAscent, type AscentSample } from "./launch/ascentProfile";

export const MU_EARTH_KM = 398_600.4418;

/**
 * The scene is drawn in two layers. The sky layer is Earth centred, in Earth
 * radii. The local layer is in metres around the spacecraft, whose centre is
 * always the local origin. This frame ties them together: its rotation maps
 * local axes into sky axes, and its origin is the spacecraft's position in
 * km from Earth's centre.
 *
 * Local axes: +x along the direction of travel (east on the pad), +y away
 * from Earth, +z completing a right handed set (south on the pad).
 */
export const frame = {
  rotation: new Quaternion(),
  originKm: new Vector3(),
  /** Ship velocity in km/s, sky axes. Zero on the pad. */
  velocityKmS: new Vector3(),
  /** Size of one sky layer unit in km: an Earth radius near Earth, a million km in the cruise. */
  skyScaleKm: EARTH_RADIUS_KM,
  /** Sky camera near plane in sky units, when the layer is not Earth centred. */
  skyNear: 0.05,
};

export const ascent = {
  /** Simulated time of liftoff, ms. */
  liftoffMs: 0,
  /** Seconds since liftoff, simulated. */
  t: 0,
  sample: sampleAscent(0) as AscentSample,
};

export const orbit = {
  elements: null as Elements | null,
  epochMs: 0,
};

const m = new Matrix4();
const up = new Vector3();
const east = new Vector3();
const xAxis = new Vector3();
const zAxis = new Vector3();

function setFrame(x: Vector3, y: Vector3): void {
  zAxis.crossVectors(x, y);
  m.makeBasis(x, y, zAxis);
  frame.rotation.setFromRotationMatrix(m);
  frame.skyScaleKm = EARTH_RADIUS_KM;
}

/** Sets the local axes from travel direction (x) and up (y), both unit length and orthogonal. */
export function setFrameAxes(x: Vector3, y: Vector3): void {
  zAxis.crossVectors(x, y);
  m.makeBasis(x, y, zAxis);
  frame.rotation.setFromRotationMatrix(m);
}

/** Up and east at the launch site at this instant, sky axes. */
function siteAxes(): void {
  const v = siteBodyVector(LAUNCH_SITE.lat, LAUNCH_SITE.lon);
  up.set(v[0], v[1], v[2]).applyMatrix4(sky.earthRotation).normalize();
  east.crossVectors(sky.earthPole, up).normalize();
}

/** Spacecraft on the pad, riding the rotating Earth. */
export function updatePadFrame(): void {
  siteAxes();
  setFrame(east, up);
  frame.originKm.copy(up).multiplyScalar(EARTH_RADIUS_KM);
  frame.velocityKmS.set(0, 0, 0);
}

/**
 * Ascent: the scripted profile, laid over the curved Earth. Downrange is an
 * arc along the site's east direction, so the local frame tilts with the
 * horizon under the rocket.
 */
export function updateAscentFrame(simMs: number): void {
  ascent.t = (simMs - ascent.liftoffMs) / 1000;
  ascent.sample = sampleAscent(ascent.t);
  if (ascent.t < EVENTS.seco) {
    applyAscentSample(ascent.sample);
    return;
  }
  if (!orbit.elements) insertIntoOrbit();
  updateOrbitFrame(simMs);
}

function applyAscentSample(s: AscentSample): void {
  siteAxes();
  const arc = s.downrangeKm / EARTH_RADIUS_KM;
  const c = Math.cos(arc);
  const sn = Math.sin(arc);
  // Rotate up and east together by the downrange arc.
  xAxis.copy(east).multiplyScalar(c).addScaledVector(up, -sn);
  up.multiplyScalar(c).addScaledVector(east, sn);
  setFrame(xAxis, up);
  frame.originKm.copy(up).multiplyScalar(EARTH_RADIUS_KM + s.altitudeKm);
  frame.velocityKmS
    .copy(xAxis)
    .multiplyScalar(Math.cos(s.pitch))
    .addScaledVector(up, Math.sin(s.pitch))
    .multiplyScalar(s.speedKmS);
}

/** Hands the ascent state at SECO to the two-body propagator. */
function insertIntoOrbit(): void {
  applyAscentSample(sampleAscent(EVENTS.seco));
  const r: Vec3 = [frame.originKm.x, frame.originKm.y, frame.originKm.z];
  const v: Vec3 = [frame.velocityKmS.x, frame.velocityKmS.y, frame.velocityKmS.z];
  orbit.elements = elementsFromState(r, v, MU_EARTH_KM);
  orbit.epochMs = ascent.liftoffMs + EVENTS.seco * 1000;
}

/** Coasting in orbit: exact two-body motion, valid at any time warp. */
export function updateOrbitFrame(simMs: number): void {
  if (!orbit.elements) return;
  const el = propagate(orbit.elements, MU_EARTH_KM, (simMs - orbit.epochMs) / 1000);
  const s = stateFromElements(el, MU_EARTH_KM);
  frame.originKm.set(...s.r);
  frame.velocityKmS.set(...s.v);
  up.copy(frame.originKm).normalize();
  // Prograde with the radial part removed, so the axes stay orthogonal on an ellipse.
  xAxis.copy(frame.velocityKmS).addScaledVector(up, -frame.velocityKmS.dot(up)).normalize();
  setFrame(xAxis, up);
}

/** Starts the ascent clock at this simulated instant. */
export function beginAscent(simMs: number): void {
  ascent.liftoffMs = simMs;
  ascent.t = 0;
  orbit.elements = null;
}

/** Puts the ship straight into orbit, as if it had launched one ascent ago. */
export function skipToOrbit(simMs: number): void {
  beginAscent(simMs - EVENTS.orbit * 1000);
  updateAscentFrame(simMs);
}

/** Whether the spacecraft is inside Earth's shadow (cylinder model). */
export function inEarthShadow(): boolean {
  const p = frame.originKm;
  const along = p.dot(sky.sunDir);
  if (along > 0) return false;
  const perp2 = p.lengthSq() - along * along;
  return perp2 < EARTH_RADIUS_KM * EARTH_RADIUS_KM;
}
