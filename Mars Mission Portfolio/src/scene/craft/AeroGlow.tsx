"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, DoubleSide, type Mesh, ShaderMaterial } from "three";
import localVert from "@/shaders/local.vert";
import plasmaFrag from "@/shaders/plasma.frag";
import { useStore } from "@/state/store";
import { AEROCAPTURE_HALF_S, mars } from "../marsRuntime";
import { sky } from "../skyRuntime";

const intensity = { value: 0 };

/**
 * Glow of the shock layer during the aerocapture pass, a cone of hot gas
 * wrapping the ship from the nose back. Peaks at periapsis, where the air
 * is densest and the ship fastest.
 */
export function AeroGlow() {
  const mesh = useRef<Mesh>(null);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: localVert,
        fragmentShader: plasmaFrag,
        uniforms: { uIntensity: intensity },
        blending: AdditiveBlending,
        transparent: true,
        depthWrite: false,
        side: DoubleSide,
      }),
    [],
  );

  useFrame(() => {
    const m = mesh.current;
    if (!m) return;
    const inPass = useStore.getState().phase === "capture" && Math.abs(sky.simMs - mars.periMs) < AEROCAPTURE_HALF_S * 1000;
    const s = (sky.simMs - mars.periMs) / 1000 / (AEROCAPTURE_HALF_S * 0.45);
    intensity.value = inPass ? 4 * Math.exp(-s * s) : 0;
    m.visible = intensity.value > 0.01;
  });

  // A cone with its tip just ahead of the capsule nose, opening back past the service module.
  return (
    <mesh ref={mesh} material={material} position={[1, 0, 0]} rotation={[0, 0, -Math.PI / 2]} visible={false}>
      <coneGeometry args={[6.5, 14, 48, 1, true]} />
    </mesh>
  );
}
