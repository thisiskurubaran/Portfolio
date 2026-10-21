"use client";

import { useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Vector3 } from "three";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { sky, updateSky } from "./skyRuntime";
import { simNow } from "@/state/simClock";

const START_DISTANCE = 3.4;
// Start with the camera off the Sun line so the first view shows the day
// side, the terminator and a sliver of city lights at once.
const START_OFFSET_RAD = 0.75;

export function CameraRig() {
  const camera = useThree((s) => s.camera);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    updateSky(simNow());
    const dir = sky.sunDir.clone().applyAxisAngle(new Vector3(0, 1, 0), START_OFFSET_RAD);
    dir.y += 0.25;
    camera.position.copy(dir.normalize().multiplyScalar(START_DISTANCE));
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return (
    <OrbitControls
      makeDefault
      enablePan={false}
      enableDamping={!reduced}
      dampingFactor={0.06}
      minDistance={1.3}
      maxDistance={60}
      rotateSpeed={0.5}
      zoomSpeed={0.6}
    />
  );
}
