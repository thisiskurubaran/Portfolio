"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh, PlaneGeometry, ShaderMaterial } from "three";
import vertexShader from "@/shaders/water.vert";
import fragmentShader from "@/shaders/water.frag";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { isHarborMode, useSceneStore } from "@/state/store";
import { BEAM, beamRuntime } from "./beamState";
import { envRuntime } from "./envRuntime";
import { seaRuntime, TIDE_RANGE } from "./seaRuntime";

const SIZE = 600;
// Large quads keep the faceted look and the vertex count low.
const SEGMENTS = 180;
// Waves run at less than half speed for people who ask for reduced motion.
// Ships sample the same clock, so they slow down with the water.
const REDUCED_TIME_SCALE = 0.4;
const HARBOR_SEA = 0.25;

export function Sea() {
  const reducedMotion = useReducedMotion();
  const mesh = useRef<Mesh>(null);
  const geometry = useMemo(() => {
    const g = new PlaneGeometry(SIZE, SIZE, SEGMENTS, SEGMENTS);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);

  // Built directly rather than through <shaderMaterial uniforms>: R3F copies
  // each uniform it is handed, which would cut these shared values loose and
  // freeze every number in them.
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        // Opaque except in the F17 clear zone, which shows the seabed below.
        transparent: true,
        uniforms: {
          uTime: seaRuntime.time,
          uSeaState: seaRuntime.seaState,
          uWindDir: seaRuntime.windDir,
          // Sky and light follow the time of day through the shared env values.
          uDeep: envRuntime.seaDeep,
          uCrest: envRuntime.seaCrest,
          uLightDir: envRuntime.lightDir,
          uLightColor: envRuntime.lightColor,
          uFogColor: envRuntime.horizon,
          uFogNear: envRuntime.fogNear,
          uFogFar: envRuntime.fogFar,
          // Held by reference, so BeamController's per frame updates reach the shader.
          uBeamOrigin: { value: beamRuntime.origin },
          uBeamDir: { value: beamRuntime.dir },
          uBeamColor: { value: BEAM.color },
          // Slightly wider than the drawn cone so the pool reads as the beam's footprint.
          uBeamCos: { value: Math.cos(BEAM.halfAngle * 1.3) },
          uBeamIntensity: beamRuntime.intensity,
          uClarity: seaRuntime.clarity,
          uClearCenter: seaRuntime.clearCenter,
          uClearRadius: seaRuntime.clearRadius,
          uSeabedY: seaRuntime.seabedY,
          uFlash: envRuntime.flash,
        },
      }),
    [],
  );

  useFrame((_, delta) => {
    seaRuntime.time.value += delta * (reducedMotion ? REDUCED_TIME_SCALE : 1);
    // Ease toward the target so weather changes roll in instead of snapping.
    const state = useSceneStore.getState();
    // Harbor mode is calm water whatever the wind is doing, unless the
    // visitor picked weather on the barometer.
    const calm = isHarborMode(state) && !state.weatherPreset;
    const target = calm ? Math.min(state.seaState, HARBOR_SEA) : state.seaState;
    seaRuntime.seaState.value += (target - seaRuntime.seaState.value) * Math.min(1, delta * 0.8);
    // F06: the whole sea rises and falls with the tide.
    if (mesh.current) mesh.current.position.y = seaRuntime.tide.value * TIDE_RANGE;
  });

  return (
    <mesh ref={mesh} geometry={geometry} material={material} frustumCulled={false} />
  );
}
