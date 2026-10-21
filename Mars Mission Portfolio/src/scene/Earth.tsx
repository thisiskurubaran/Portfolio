"use client";

import { useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import {
  AdditiveBlending,
  BackSide,
  type Group,
  RepeatWrapping,
  ShaderMaterial,
  SRGBColorSpace,
  type Texture,
  TextureLoader,
  Vector2,
} from "three";
import planetVert from "@/shaders/planet.vert";
import planetFrag from "@/shaders/planet.frag";
import cloudsFrag from "@/shaders/clouds.frag";
import atmosphereFrag from "@/shaders/atmosphere.frag";
import { ATMOSPHERE_RADIUS, CLOUD_RADIUS } from "./scale";
import { sky } from "./skyRuntime";

const TEXTURES = [
  "/textures/earth/day.jpg",
  "/textures/earth/night.jpg",
  "/textures/earth/water.jpg",
  "/textures/earth/topology.jpg",
  "/textures/earth/clouds.jpg",
];

const SUN_INTENSITY = 1.6;
// Weather systems move relative to the ground. One texture width every
// 30 sim days is slow enough to read as drift, not spin.
const CLOUD_DRIFT_PER_MS = 1 / (30 * 86_400_000);

// Shared by reference so per frame writes reach every shader using them.
const shared = {
  uSunDir: { value: sky.sunDir },
  uSunIntensity: { value: SUN_INTENSITY },
  uCloudShift: { value: 0 },
};

function buildMaterials(textures: Texture[]) {
  const [day, night, water, topo, clouds] = textures as [Texture, Texture, Texture, Texture, Texture];
  day.colorSpace = SRGBColorSpace;
  night.colorSpace = SRGBColorSpace;
  for (const t of textures) {
    t.wrapS = RepeatWrapping;
    t.anisotropy = 8;
  }
  const image = topo.image as { width: number; height: number };
  return {
    surface: new ShaderMaterial({
      vertexShader: planetVert,
      fragmentShader: planetFrag,
      uniforms: {
        ...shared,
        uDay: { value: day },
        uNight: { value: night },
        uWater: { value: water },
        uTopo: { value: topo },
        uClouds: { value: clouds },
        uPole: { value: sky.earthPole },
        uTexel: { value: new Vector2(1 / image.width, 1 / image.height) },
      },
    }),
    clouds: new ShaderMaterial({
      vertexShader: planetVert,
      fragmentShader: cloudsFrag,
      uniforms: { ...shared, uClouds: { value: clouds } },
      transparent: true,
      depthWrite: false,
    }),
    atmosphere: new ShaderMaterial({
      vertexShader: planetVert,
      fragmentShader: atmosphereFrag,
      uniforms: shared,
      side: BackSide,
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
  };
}

export function Earth() {
  const textures = useLoader(TextureLoader, TEXTURES);
  const group = useRef<Group>(null);
  const materials = useMemo(() => buildMaterials(textures), [textures]);

  useFrame(() => {
    group.current?.setRotationFromMatrix(sky.earthRotation);
    shared.uCloudShift.value = (sky.simMs * CLOUD_DRIFT_PER_MS) % 1;
  });

  return (
    <>
      <group ref={group}>
        <mesh material={materials.surface}>
          <sphereGeometry args={[1, 128, 64]} />
        </mesh>
        <mesh material={materials.clouds}>
          <sphereGeometry args={[CLOUD_RADIUS, 96, 48]} />
        </mesh>
      </group>
      {/* The atmosphere is symmetric, so it does not need to rotate with the ground. */}
      <mesh material={materials.atmosphere}>
        <sphereGeometry args={[ATMOSPHERE_RADIUS, 96, 48]} />
      </mesh>
    </>
  );
}
