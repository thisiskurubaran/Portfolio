"use client";

import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import { shipRuntime } from "./shipRuntime";

const v = new Vector3();

/**
 * Projects ship anchors to screen space for the label layer. Mounted after
 * the camera rig so labels use this frame's camera and do not lag behind.
 */
export function ShipTracker() {
  useFrame(({ camera, size }) => {
    for (const s of shipRuntime.values()) {
      v.copy(s.anchor).project(camera);
      s.onScreen = v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1;
      s.sx = ((v.x + 1) / 2) * size.width;
      s.sy = ((1 - v.y) / 2) * size.height;
    }
  });
  return null;
}
