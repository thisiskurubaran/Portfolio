import { Color, Vector3 } from "three";
import { LANTERN_Y } from "./layout";

export const BEAM = {
  /** Pitch in radians at tilt 0 and tilt 1. Negative points down at the water. */
  // Steep enough to reach the rowboat at the jetty.
  pitchNear: -0.75,
  pitchFar: -0.05,
  halfAngle: 0.075,
  length: 140,
  color: new Color("#ffe2a8"),
};

/**
 * The beam as it is drawn this frame, after easing. Mutated in place by
 * BeamController so the cone, the water and the camera read the same values
 * without React re-renders. Shader uniforms hold these vectors by reference.
 */
export const beamRuntime = {
  yaw: 0,
  tilt: 0.65,
  origin: new Vector3(0, LANTERN_Y, 0),
  dir: new Vector3(0, 0, -1),
  intensity: { value: 1 },
  /** Fraction of the cone length where the axis meets the sea, 1 if it never does. */
  hitAlong: { value: 1 },
};

export function tiltToPitch(tilt: number): number {
  return BEAM.pitchNear + (BEAM.pitchFar - BEAM.pitchNear) * tilt;
}

export function directionFrom(yaw: number, pitch: number, out: Vector3): Vector3 {
  const c = Math.cos(pitch);
  return out.set(-Math.sin(yaw) * c, Math.sin(pitch), -Math.cos(yaw) * c);
}

/** Yaw and tilt that point the beam at a spot on the water. */
export function aimAt(x: number, z: number): { yaw: number; tilt: number } {
  const dx = x - beamRuntime.origin.x;
  const dz = z - beamRuntime.origin.z;
  const yaw = Math.atan2(-dx, -dz);
  const pitch = -Math.atan2(beamRuntime.origin.y, Math.hypot(dx, dz));
  const tilt = (pitch - BEAM.pitchNear) / (BEAM.pitchFar - BEAM.pitchNear);
  return { yaw, tilt };
}
