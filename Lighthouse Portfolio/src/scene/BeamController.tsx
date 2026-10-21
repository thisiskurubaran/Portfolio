"use client";

import { useFrame } from "@react-three/fiber";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { isHarborMode, useSceneStore } from "@/state/store";
import { envRuntime } from "./envRuntime";
import { aimAt, BEAM, beamRuntime, directionFrom, tiltToPitch } from "./beamState";
import { shipRuntime } from "./ships/shipRuntime";
import { useBeamInput } from "./useBeamInput";

const KEY_YAW_SPEED = 1.1;
const KEY_TILT_SPEED = 0.6;
const EASE = 7;

/**
 * Turns input targets into the beam that is drawn. Mounted before the other
 * scene parts so its frame callback runs first and they read fresh values.
 */
export function BeamController() {
  const keys = useBeamInput();
  const reducedMotion = useReducedMotion();

  useFrame(({ clock }, delta) => {
    const k = keys.current;
    const dYaw = (Number(k.left) - Number(k.right)) * KEY_YAW_SPEED * delta;
    const dTilt = (Number(k.up) - Number(k.down)) * KEY_TILT_SPEED * delta;
    if (dYaw || dTilt) useSceneStore.getState().nudgeBeam(dYaw, dTilt);

    // Hold the open ship in the light while it drifts, so it stays readable
    // behind the panel. Otherwise follow the ship focused from the keyboard.
    const { panelOpen, selectedId, focusedId } = useSceneStore.getState();
    const heldId = panelOpen ? selectedId : focusedId;
    const held = heldId ? shipRuntime.get(heldId) : undefined;
    if (held) {
      const aim = aimAt(held.anchor.x, held.anchor.z, held.aimY);
      useSceneStore.getState().setBeamTarget(aim.yaw, aim.tilt);
    }

    // Harbor mode: the lamp is off by day, so the beam fades out.
    let lampOn = isHarborMode(useSceneStore.getState()) ? 0 : 1;
    // F03: the lamp flickers in a storm. Slow waves under 3 Hz and a small
    // dip, so it wavers rather than strobes. None for reduced motion.
    if (!reducedMotion && envRuntime.storm.value > 0) {
      const t = clock.elapsedTime;
      const wobble = 0.5 + 0.5 * Math.sin(t * 5.7) * Math.sin(t * 10.7 + 1.3) * Math.sin(t * 16.3 + 0.4);
      lampOn *= 1 - envRuntime.storm.value * 0.18 * wobble;
    }
    beamRuntime.intensity.value += (lampOn - beamRuntime.intensity.value) * Math.min(1, delta * 6);

    const target = useSceneStore.getState().beamTarget;
    const t = 1 - Math.exp(-EASE * delta);
    beamRuntime.yaw += (target.yaw - beamRuntime.yaw) * t;
    beamRuntime.tilt += (target.tilt - beamRuntime.tilt) * t;
    directionFrom(beamRuntime.yaw, tiltToPitch(beamRuntime.tilt), beamRuntime.dir);

    const down = Math.max(-beamRuntime.dir.y, 0.001);
    beamRuntime.hitAlong.value = Math.min(1, beamRuntime.origin.y / down / BEAM.length);
  });

  return null;
}
