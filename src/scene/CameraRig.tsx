"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Vector3 } from "three";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { beamRuntime } from "./beamState";
import { LANTERN_Y } from "./layout";

// Just behind and above the lantern room, looking out over the water.
const HOME = new Vector3(4, LANTERN_Y + 9, 11);
const TARGET = new Vector3(-1, 2, -45);
// The camera turns part of the way with the beam, so the beam can reach the
// edge of the view without the camera swinging the full arc. Portrait
// screens see a narrow slice of sea, so they follow more closely.
const FOLLOW_WIDE = 0.6;
const FOLLOW_TALL = 0.88;
const EASE = 2.5;

const pos = new Vector3();
const look = new Vector3();
const up = new Vector3(0, 1, 0);

export function CameraRig() {
  const camera = useThree((s) => s.camera);
  const aspect = useThree((s) => s.size.width / s.size.height);
  const follow = aspect < 1 ? FOLLOW_TALL : FOLLOW_WIDE;
  const reducedMotion = useReducedMotion();
  const yaw = useRef(0);

  useEffect(() => {
    camera.position.copy(HOME);
    camera.lookAt(TARGET);
  }, [camera]);

  useFrame(({ clock }, delta) => {
    yaw.current += (beamRuntime.yaw * follow - yaw.current) * (1 - Math.exp(-EASE * delta));

    pos.copy(HOME).applyAxisAngle(up, yaw.current);
    look.copy(TARGET).applyAxisAngle(up, yaw.current);

    if (!reducedMotion) {
      // A slow sway so the view feels like standing in a tower in the wind.
      const t = clock.elapsedTime;
      pos.x += Math.sin(t * 0.23) * 0.12;
      pos.y += Math.sin(t * 0.31) * 0.08;
    }

    camera.position.copy(pos);
    camera.lookAt(look);
  });

  return null;
}
