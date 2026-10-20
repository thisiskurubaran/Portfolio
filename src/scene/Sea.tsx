"use client";

import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { PlaneGeometry } from "three";
import vertexShader from "@/shaders/water.vert";
import fragmentShader from "@/shaders/water.frag";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useSceneStore } from "@/state/store";
import { BEAM, beamRuntime } from "./beamState";
import { MOON_DIR, NIGHT } from "./palette";
import { seaRuntime } from "./seaRuntime";

const SIZE = 600;
// Large quads keep the faceted look and the vertex count low.
const SEGMENTS = 180;
// Waves run at less than half speed for people who ask for reduced motion.
// Ships sample the same clock, so they slow down with the water.
const REDUCED_TIME_SCALE = 0.4;

export function Sea() {
  const reducedMotion = useReducedMotion();
  const geometry = useMemo(() => {
    const g = new PlaneGeometry(SIZE, SIZE, SEGMENTS, SEGMENTS);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: seaRuntime.time,
      uSeaState: seaRuntime.seaState,
      uWindDir: seaRuntime.windDir,
      uDeep: { value: NIGHT.seaDeep },
      uCrest: { value: NIGHT.seaCrest },
      uMoonDir: { value: MOON_DIR },
      uMoonLight: { value: NIGHT.moonLight },
      uFogColor: { value: NIGHT.horizon },
      uFogNear: { value: NIGHT.fogNear },
      uFogFar: { value: NIGHT.fogFar },
      // Held by reference, so BeamController's per frame updates reach the shader.
      uBeamOrigin: { value: beamRuntime.origin },
      uBeamDir: { value: beamRuntime.dir },
      uBeamColor: { value: BEAM.color },
      // Slightly wider than the drawn cone so the pool reads as the beam's footprint.
      uBeamCos: { value: Math.cos(BEAM.halfAngle * 1.3) },
      uBeamIntensity: beamRuntime.intensity,
    }),
    [],
  );

  useFrame((_, delta) => {
    seaRuntime.time.value += delta * (reducedMotion ? REDUCED_TIME_SCALE : 1);
    // Ease toward the target so weather changes roll in instead of snapping.
    const target = useSceneStore.getState().seaState;
    seaRuntime.seaState.value += (target - seaRuntime.seaState.value) * Math.min(1, delta * 0.8);
  });

  return (
    <mesh geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}
