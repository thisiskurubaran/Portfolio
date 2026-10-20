"use client";

import { useFrame } from "@react-three/fiber";
import { useSceneStore } from "@/state/store";
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

  useFrame((_, delta) => {
    const k = keys.current;
    const dYaw = (Number(k.left) - Number(k.right)) * KEY_YAW_SPEED * delta;
    const dTilt = (Number(k.up) - Number(k.down)) * KEY_TILT_SPEED * delta;
    if (dYaw || dTilt) useSceneStore.getState().nudgeBeam(dYaw, dTilt);

    // Hold the open ship in the light while it drifts, so it stays readable
    // behind the panel.
    const { panelOpen, selectedId } = useSceneStore.getState();
    const open = panelOpen && selectedId ? shipRuntime.get(selectedId) : undefined;
    if (open) {
      const aim = aimAt(open.anchor.x, open.anchor.z);
      useSceneStore.getState().setBeamTarget(aim.yaw, aim.tilt);
    }

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
