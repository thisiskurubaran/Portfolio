import { Vector3 } from "three";
import type { StepId } from "@/content/guide";
import { skillGroups } from "@/content/skills";
import { useStore } from "@/state/store";
import { beginMarsApproach, depart, dock, launch, skip, toNextStation } from "@/ui/missionActions";
import { JOINT_HEIGHT } from "../craft/Rocket";
import { GROUND_Y } from "../surface/Surface";
import { surface } from "../surfaceRuntime";
import { HOLD_M, SHIP_PORT_X } from "../transit/Station";
import { astro, type Interactable, interact, moveTo, setAstroMode } from "./astronautRuntime";

/** Ground level on the pad, in the local frame (the rocket's joint is the origin). */
export const PAD_GROUND = -JOINT_HEIGHT;
export const BOARD_AT = new Vector3(18, PAD_GROUND, 22);
export const LIFT_AT = new Vector3(-9.2, PAD_GROUND, 0);
/** The crew access arm's floor, and its end at the hatch. */
const ARM_START = new Vector3(-9.2, 0.3, 0);
const ARM_END = new Vector3(-2.7, 0.3, 0);
export const PAD_SPAWN = new Vector3(30, PAD_GROUND, 32);

/** The capsule's side hatch, and where the astronaut floats out of it. */
export const HATCH_AT = new Vector3(1.6, 2.6, 0);
/** Instrument pods on a ring ahead of the ship's nose, one per skill group. */
export const PODS = skillGroups.map((g, i) => {
  const a = (i / skillGroups.length) * Math.PI * 2;
  return { id: g.id, name: g.name, at: new Vector3(11, 9 * Math.cos(a), 9 * Math.sin(a)) };
});
/** The station's docking port while the ship holds off it. */
export const PORT_AT = new Vector3(SHIP_PORT_X + HOLD_M - 1.5, 0, 0);
/** Where the astronaut steps down beside the lander on Mars, terrain metres. */
export const MARS_SPAWN = { x: 5, z: 4 };

export const progress = {
  briefRead: false,
  podsSeen: new Set<string>(),
  backInside: false,
  roverFound: false,
  inRover: false,
};

export type Objective = { step: StepId; target: Vector3 | null; autopilot: (() => void) | null };
export const objective: { current: Objective } = { current: { step: "board", target: BOARD_AT, autopilot: null } };

function readBrief(): void {
  progress.briefRead = true;
  useStore.getState().setBriefOpen(true);
}

/** Lift ride up the tower, then along the crew access arm into the capsule. */
export function board(): void {
  if (astro.scripted) return;
  readBrief();
  useStore.getState().setBriefOpen(false);
  astro.pos.copy(LIFT_AT);
  moveTo(ARM_START, 5000, () =>
    moveTo(ARM_END, 3000, () => {
      setAstroMode("aboard");
      launch();
    }),
  );
}

function openPod(id: string): void {
  progress.podsSeen.add(id);
  useStore.getState().setOpenSkill(id);
}

function goInside(): void {
  progress.backInside = true;
  setAstroMode("aboard");
}

export function enterRover(): void {
  progress.roverFound = true;
  progress.inRover = true;
  setAstroMode("aboard");
}

export function leaveRover(): void {
  progress.inRover = false;
  // Step down on the rover's left side.
  const r = surface.rover;
  setAstroMode("walk", new Vector3(r.x - 1.5, r.y + GROUND_Y, r.z + 3.2));
}

const roverAt = new Vector3();
const near = (id: string, at: Vector3, radius: number, label: string, act: () => void): Interactable => ({
  id,
  at,
  radius,
  label,
  act,
});

/**
 * The guide's rules: from the phase and what the visitor has done, the
 * current objective, its marker, and what can be used right now.
 */
export function updateGuide(labels: Record<StepId | "place", string>): Objective {
  const { phase, transitMode, surfaceTarget } = useStore.getState();
  const list: Interactable[] = [];
  let o: Objective;

  if (phase === "pad") {
    list.push(near("board", BOARD_AT, 3, labels.board, readBrief));
    list.push(near("lift", LIFT_AT, 2.8, labels.lift, board));
    o = progress.briefRead
      ? { step: astro.scripted ? "boarding" : "lift", target: astro.scripted ? null : LIFT_AT, autopilot: board }
      : { step: "board", target: BOARD_AT, autopilot: readBrief };
  } else if (phase === "countdown" || phase === "ascent") {
    o = { step: "ascent", target: null, autopilot: skip };
  } else if (phase === "orbit") {
    if (astro.mode === "eva") {
      for (const p of PODS) list.push(near(`pod:${p.id}`, p.at, 2.5, `${labels.pods}: ${p.name}`, () => openPod(p.id)));
      list.push(near("hatch", HATCH_AT, 2.2, labels.hatch, goInside));
      const next = PODS.find((p) => !progress.podsSeen.has(p.id));
      o =
        progress.podsSeen.size === 0 && next
          ? { step: "pods", target: next.at, autopilot: () => openPod(next.id) }
          : { step: "hatch", target: HATCH_AT, autopilot: goInside };
    } else {
      o = { step: "depart", target: null, autopilot: depart };
    }
  } else if (phase === "tmi") {
    o = { step: "cruise", target: null, autopilot: null };
  } else if (phase === "transit" || phase === "marsOrbit") {
    if (transitMode === "holding") {
      list.push(near("port", PORT_AT, 4, labels.station, dock));
      o = { step: "station", target: PORT_AT, autopilot: dock };
    } else if (transitMode === "docking" || transitMode === "docked") {
      o = { step: "docked", target: null, autopilot: null };
    } else if (transitMode === "arrived") {
      o = { step: "arrived", target: null, autopilot: beginMarsApproach };
    } else if (phase === "marsOrbit") {
      o = { step: "site", target: null, autopilot: null };
    } else {
      o = { step: "cruise", target: null, autopilot: toNextStation };
    }
  } else if (phase === "capture") {
    o = { step: "capture", target: null, autopilot: null };
  } else if (phase === "descent") {
    o = { step: "descent", target: null, autopilot: null };
  } else {
    roverAt.set(surface.rover.x, surface.rover.y + GROUND_Y, surface.rover.z);
    if (astro.mode === "walk") list.push(near("rover", roverAt, 4, labels.rover, enterRover));
    if (surfaceTarget) {
      const id = surfaceTarget;
      list.push(near("place", astro.pos, 99, labels.place, () => useStore.getState().setSurfaceOpen(id)));
    }
    o = progress.roverFound
      ? { step: "explore", target: null, autopilot: null }
      : { step: "rover", target: roverAt, autopilot: enterRover };
  }

  interact.list = list;
  interact.near =
    astro.mode === "aboard" && !progress.inRover
      ? null
      : (list.find((i) => (i.id === "place" ? true : i.at.distanceTo(astro.pos) < i.radius)) ?? null);
  objective.current = o;
  return o;
}
