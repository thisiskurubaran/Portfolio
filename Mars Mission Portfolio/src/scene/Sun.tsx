"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { type DirectionalLight, type Mesh, ShaderMaterial } from "three";
import planetVert from "@/shaders/planet.vert";
import sunFrag from "@/shaders/sun.frag";
import { SUN_SCENE_DISTANCE, sunSceneRadius } from "./scale";
import { sky } from "./skyRuntime";

// High enough that the disc saturates through tone mapping and blooms.
const DISC_INTENSITY = 40;

/**
 * The Sun disc and the scene's one real light. The light is directional
 * because at 1 AU the rays across anything in view are parallel to within
 * a fraction of a degree.
 */
export function Sun() {
  const disc = useRef<Mesh>(null);
  const light = useRef<DirectionalLight>(null);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: planetVert,
        fragmentShader: sunFrag,
        uniforms: { uIntensity: { value: DISC_INTENSITY } },
        // Drawn on the far side of everything; stars never cover it.
        depthWrite: false,
      }),
    [],
  );

  useFrame(() => {
    if (disc.current) {
      disc.current.position.copy(sky.view.sunDir).multiplyScalar(SUN_SCENE_DISTANCE);
      disc.current.scale.setScalar(sunSceneRadius(sky.view.sunDistanceAu));
    }
    light.current?.position.copy(sky.view.sunDir).multiplyScalar(10);
  });

  return (
    <>
      <mesh ref={disc} material={material} renderOrder={-1}>
        <sphereGeometry args={[1, 48, 24]} />
      </mesh>
      {/* Sunlight at 5772 K is close to neutral white in linear sRGB. */}
      <directionalLight ref={light} color="#fff4ea" intensity={3} />
    </>
  );
}
