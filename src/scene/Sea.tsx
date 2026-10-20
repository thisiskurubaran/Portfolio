"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { PlaneGeometry, ShaderMaterial, Vector2 } from "three";
import vertexShader from "@/shaders/water.vert";
import fragmentShader from "@/shaders/water.frag";
import { useSceneStore } from "@/state/store";
import { MOON_DIR, NIGHT } from "./palette";

const SIZE = 600;
// Large quads keep the faceted look and the vertex count low.
const SEGMENTS = 180;

export function Sea() {
  const geometry = useMemo(() => {
    const g = new PlaneGeometry(SIZE, SIZE, SEGMENTS, SEGMENTS);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);

  const materialRef = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSeaState: { value: useSceneStore.getState().seaState },
      uWindDir: { value: new Vector2(0.3, -1) },
      uDeep: { value: NIGHT.seaDeep },
      uCrest: { value: NIGHT.seaCrest },
      uMoonDir: { value: MOON_DIR },
      uMoonLight: { value: NIGHT.moonLight },
      uFogColor: { value: NIGHT.horizon },
      uFogNear: { value: NIGHT.fogNear },
      uFogFar: { value: NIGHT.fogFar },
    }),
    [],
  );

  useFrame((_, delta) => {
    const material = materialRef.current;
    if (!material) return;
    const u = material.uniforms;
    u.uTime!.value += delta;
    // Ease toward the target so weather changes roll in instead of snapping.
    const target = useSceneStore.getState().seaState;
    u.uSeaState!.value += (target - u.uSeaState!.value) * Math.min(1, delta * 0.8);
  });

  return (
    <mesh geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}
