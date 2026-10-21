import { Vector3 } from "three";
import { useStore } from "@/state/store";

/**
 * The visitor's astronaut. "walk" is on the ground at the pad and on Mars,
 * "eva" is free flight on a jetpack outside the ship, and "aboard" means
 * strapped in, inside a station or driving the rover, with the body hidden.
 */
export type AstroMode = "walk" | "eva" | "aboard";

/** Suited walking pace and a slow jog, m/s; space suits do not allow much more. */
export const WALK_SPEED = 1.6;
export const RUN_SPEED = 3.2;
/** Jetpack thrust, m/s^2. NASA's SAFER pack gives about 0.1; this is livelier. */
export const EVA_THRUST = 0.6;
/** Delta-v the jetpack holds, m/s. Refilled every time the astronaut goes back inside. */
export const EVA_DV = 30;
/** Safety tether length, m, measured from the hatch. */
export const TETHER_M = 70;
/** Suit height, m, for the eye line and the follow camera. */
export const SUIT_HEIGHT = 1.9;

export const astro = {
  mode: "aboard" as AstroMode,
  pos: new Vector3(),
  vel: new Vector3(),
  /** Facing, radians about +y; 0 faces +x. */
  yaw: 0,
  onGround: true,
  /** Jetpack propellant left, as delta-v in m/s. */
  evaDv: EVA_DV,
  /** Where the tether is clipped on, for EVA. */
  anchor: new Vector3(),
  /** 0 to 1, how far through a stride, for the walk cycle. */
  stride: 0,
  /** Set while a scripted move (lift ride, boarding) is running. */
  scripted: null as null | { from: Vector3; to: Vector3; startMs: number; durationMs: number; done: () => void },
  /** Bumps on every mode change, so the camera knows to re-frame. */
  revision: 0,
};

export const astroInput = {
  forward: 0,
  right: 0,
  /** Jump on the ground; thrust up on EVA. */
  up: false,
  /** Run on the ground; thrust down on EVA. */
  down: false,
  /** Kill drift with the jetpack. */
  stabilise: false,
};

export function setAstroMode(mode: AstroMode, at?: Vector3, yaw?: number): void {
  astro.mode = mode;
  if (at) astro.pos.copy(at);
  if (yaw !== undefined) astro.yaw = yaw;
  astro.vel.set(0, 0, 0);
  astro.scripted = null;
  if (mode === "eva") {
    astro.anchor.copy(astro.pos);
    astro.evaDv = EVA_DV;
  }
  astro.revision++;
  if (useStore.getState().astroMode !== mode) useStore.getState().setAstroModeState(mode);
}

/** Runs a straight scripted move, then calls done. */
export function moveTo(to: Vector3, durationMs: number, done: () => void): void {
  astro.scripted = { from: astro.pos.clone(), to: to.clone(), startMs: Date.now(), durationMs, done };
}

/** Things the astronaut can walk or float up to, set by the guide each frame. */
export type Interactable = {
  id: string;
  /** Local layer position, metres. */
  at: Vector3;
  radius: number;
  label: string;
  act: () => void;
};

export const interact = { list: [] as Interactable[], near: null as Interactable | null };
