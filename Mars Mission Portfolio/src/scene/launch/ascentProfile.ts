import { monotoneCubic } from "@/physics/interpolate";

/**
 * Scripted ascent: the one deliberately non-physical part of the flight,
 * kept apart from the physics modules. Altitude, downrange, speed and pitch
 * follow curves shaped like a real two stage crewed launch to a 200 km
 * orbit. At SECO the state hands over to the Kepler propagator, so the
 * speed there is the real circular speed for that altitude.
 */

/** Seconds after liftoff. */
const T = [0, 2, 5, 10, 30, 60, 90, 120, 150, 180, 240, 300, 360, 420, 480, 520];
/** Altitude, km. */
const H = [0, 0.01, 0.0625, 0.25, 2.5, 11, 27, 45, 62, 80, 115, 145, 170, 186, 196, 200];
/** Ground distance travelled east, km. */
const D = [0, 0, 0, 0, 0.3, 3, 12, 30, 55, 90, 190, 330, 500, 720, 990, 1180];
/** Speed, km/s. */
const V = [0, 0.01, 0.025, 0.05, 0.25, 0.55, 1.0, 1.6, 2.3, 2.6, 3.4, 4.3, 5.2, 6.2, 7.1, 7.788];
/** Pitch above the local horizon, degrees. */
const P = [90, 90, 90, 90, 85, 70, 58, 48, 40, 34, 24, 17, 11, 6, 2, 0];

const alt = monotoneCubic(T, H);
const down = monotoneCubic(T, D);
const speed = monotoneCubic(T, V);
const pitch = monotoneCubic(T, P);

export const INSERTION_ALTITUDE_KM = 200;

export const EVENTS = {
  liftoff: 0,
  maxQ: 70,
  meco: 148,
  stageSeparation: 150,
  secondStageIgnition: 155,
  towerJettison: 175,
  seco: 520,
  spacecraftSeparation: 525,
  arraysDeploy: 530,
  orbit: 545,
} as const;

export type AscentEvent = keyof typeof EVENTS;

/** Simulated seconds per real second while nothing much changes. */
export const ASCENT_WARP = 20;

/**
 * Real time windows, so liftoff, staging and orbit insertion play at their
 * true speed while the long burns in between are compressed.
 */
const REAL_TIME: readonly [number, number][] = [
  [0, 12],
  [EVENTS.meco - 2, EVENTS.secondStageIgnition + 3],
  [EVENTS.seco - 2, EVENTS.orbit],
];

export function ascentWarp(t: number): number {
  return REAL_TIME.some(([a, b]) => t >= a && t < b) ? 1 : ASCENT_WARP;
}

export type AscentSample = {
  altitudeKm: number;
  downrangeKm: number;
  speedKmS: number;
  /** Radians above the local horizon. */
  pitch: number;
  /** Main engine running (stage 1 or 2). */
  thrust: boolean;
};

export function sampleAscent(t: number): AscentSample {
  const tc = Math.min(Math.max(t, 0), EVENTS.seco);
  return {
    altitudeKm: alt(tc),
    downrangeKm: down(tc),
    speedKmS: speed(tc),
    pitch: (pitch(tc) * Math.PI) / 180,
    thrust:
      (t >= 0 && t < EVENTS.meco) || (t >= EVENTS.secondStageIgnition && t < EVENTS.seco),
  };
}

/** The most recent event at time t, for the HUD. */
export function currentEvent(t: number): AscentEvent | null {
  let last: AscentEvent | null = null;
  for (const [id, at] of Object.entries(EVENTS) as [AscentEvent, number][]) {
    if (t >= at) last = id;
  }
  return last;
}
