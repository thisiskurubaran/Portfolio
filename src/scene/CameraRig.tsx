"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { Vector3 } from "three";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { LANTERN_Y } from "./layout";

// Just behind and above the lantern room, looking out over the water.
const HOME = new Vector3(0, LANTERN_Y + 3.2, 7.5);
const TARGET = new Vector3(0, 4, -40);

export function CameraRig() {
  const camera = useThree((s) => s.camera);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    camera.position.copy(HOME);
    camera.lookAt(TARGET);
  }, [camera]);

  useFrame(({ clock }) => {
    if (reducedMotion) return;
    // A slow sway so the view feels like standing in a tower in the wind.
    const t = clock.elapsedTime;
    camera.position.set(HOME.x + Math.sin(t * 0.23) * 0.12, HOME.y + Math.sin(t * 0.31) * 0.08, HOME.z);
    camera.lookAt(TARGET);
  });

  return null;
}
