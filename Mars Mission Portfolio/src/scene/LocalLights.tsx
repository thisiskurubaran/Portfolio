"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, type DirectionalLight, type HemisphereLight, type SpotLight } from "three";
import { useStore } from "@/state/store";
import { JOINT_HEIGHT } from "./craft/Rocket";
import { local } from "./localRuntime";

const space = new Color(0.01, 0.01, 0.015);

/**
 * Lights for the local layer. The Sun is the one real light; the hemisphere
 * stands in for skylight on the pad and for earthshine in orbit. Pad
 * floodlights come on at night, as they do at real launch complexes.
 */
export function LocalLights() {
  const sun = useRef<DirectionalLight>(null);
  const fill = useRef<HemisphereLight>(null);
  const flood = useRef<SpotLight>(null);

  useFrame(() => {
    const onGround = local.air.value > 0.01;
    if (sun.current) {
      sun.current.position.copy(local.sunDir).multiplyScalar(100);
      sun.current.color.copy(local.sunColor);
      sun.current.intensity = 3.2 * local.daylight.value * local.sunStrength;
    }
    if (fill.current) {
      if (onGround) {
        fill.current.color.copy(local.skyColor);
        fill.current.groundColor.copy(local.groundColor);
        fill.current.intensity = 0.03 + 0.7 * local.daylight.value * local.air.value;
      } else {
        // Near Earth, it fills most of the lower sky and is bright only on its day side.
        fill.current.color.copy(space);
        fill.current.groundColor.copy(local.shineColor);
        fill.current.intensity = 0.04 + 0.9 * local.earthshine;
      }
    }
    if (flood.current) {
      const phase = useStore.getState().phase;
      const onPad = phase === "pad" || phase === "countdown";
      flood.current.intensity = onPad ? 3e4 * (1 - local.daylight.value) : 0;
      // The target is not in the scene graph, so its matrix is kept up to date here.
      flood.current.target.position.set(0, -JOINT_HEIGHT / 2, 0);
      flood.current.target.updateMatrixWorld();
    }
  });

  return (
    <>
      <directionalLight ref={sun} />
      <hemisphereLight ref={fill} />
      <spotLight
        ref={flood}
        position={[60, -JOINT_HEIGHT + 4, 60]}
        angle={0.32}
        penumbra={0.6}
        color="#fff1dc"
        decay={2}
        intensity={0}
      />
    </>
  );
}
