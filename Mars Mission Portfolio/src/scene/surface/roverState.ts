import type { RoverSim } from "./roverSim";

/** What the driver asks for, from keys or the on-screen pad. */
export const driveInput = { throttle: 0, steer: 0, brake: false };

/** Readings for the HUD, written each frame by the surface scene. */
export const roverState = {
  speed: 0,
  tiltDeg: 0,
  headingDeg: 0,
  nearest: null as { id: string; d: number } | null,
  sim: null as RoverSim | null,
};

/** Past this, the rover is on its side or roof and needs righting. */
export const FLIPPED_DEG = 70;
/** Past this, a crater rim or side slope is a real rollover risk. */
export const TILT_WARN_DEG = 25;
