"use client";

import { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { AdditiveBlending, BackSide, BufferAttribute, BufferGeometry, Color, ShaderMaterial } from "three";
import skyVert from "@/shaders/sky.vert";
import skyFrag from "@/shaders/sky.frag";
import starsVert from "@/shaders/stars.vert";
import starsFrag from "@/shaders/stars.frag";
import moonVert from "@/shaders/moon.vert";
import moonFrag from "@/shaders/moon.frag";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { hash3 } from "./bake";
import { envRuntime } from "./envRuntime";
import { MOON_DIR, PALETTES } from "./palette";

const DOME_RADIUS = 500;
const STAR_RADIUS = 450;
const STAR_COUNT = 1800;
const MOON_DISTANCE = 420;

// Star uniforms that change every frame. There is one sky, so module scope is fine.
const starTime = { value: 0 };
const starPixelRatio = { value: 1 };
const starTwinkle = { value: 1 };

function starGeometry(): BufferGeometry {
  const positions = new Float32Array(STAR_COUNT * 3);
  const sizes = new Float32Array(STAR_COUNT);
  const phases = new Float32Array(STAR_COUNT);

  for (let i = 0; i < STAR_COUNT; i++) {
    // Deterministic so the sky is the same on every visit and every render.
    const u = hash3(i, 1.3, 7.1);
    const v = hash3(i, 9.7, 2.9);
    const theta = u * Math.PI * 2;
    const y = 0.02 + v * 0.98;
    const r = Math.sqrt(1 - y * y);
    positions.set([Math.cos(theta) * r * STAR_RADIUS, y * STAR_RADIUS, Math.sin(theta) * r * STAR_RADIUS], i * 3);

    const bright = hash3(i, 4.4, 0.5);
    sizes[i] = 1.2 + bright * bright * bright * 3.2;
    phases[i] = hash3(i, 3.3, 8.8);
  }

  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(positions, 3));
  g.setAttribute("aSize", new BufferAttribute(sizes, 1));
  g.setAttribute("aPhase", new BufferAttribute(phases, 1));
  return g;
}

// Materials are built directly, not through <shaderMaterial uniforms>, because
// R3F copies each uniform it is given and the shared env values would freeze.
function makeMaterials() {
  return {
    dome: new ShaderMaterial({
      vertexShader: skyVert,
      fragmentShader: skyFrag,
      side: BackSide,
      depthWrite: false,
      uniforms: {
        uHorizon: envRuntime.horizon,
        uZenith: envRuntime.zenith,
        uMoonDir: { value: MOON_DIR },
        uMoonLight: { value: PALETTES.night.light },
        uMoonVisibility: envRuntime.moonVisibility,
        uSunDir: envRuntime.sunDir,
        uGlowColor: envRuntime.glowColor,
        uGlow: envRuntime.glow,
      },
    }),
    stars: new ShaderMaterial({
      vertexShader: starsVert,
      fragmentShader: starsFrag,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: {
        uTime: starTime,
        uPixelRatio: starPixelRatio,
        uTwinkle: starTwinkle,
        // Fades with daylight and cloud cover.
        uVisibility: envRuntime.starVisibility,
      },
    }),
    moon: new ShaderMaterial({
      vertexShader: moonVert,
      fragmentShader: moonFrag,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uPhase: envRuntime.moonPhase,
        uVisibility: envRuntime.moonVisibility,
        uColor: { value: new Color("#e6ecf5") },
      },
    }),
  };
}

export function Sky() {
  const dpr = useThree((s) => s.viewport.dpr);
  const reducedMotion = useReducedMotion();
  const stars = useMemo(() => starGeometry(), []);
  const materials = useMemo(() => makeMaterials(), []);

  useFrame((_, delta) => {
    starTime.value += delta;
    starPixelRatio.value = dpr;
    starTwinkle.value = reducedMotion ? 0 : 1;
  });

  const moonPosition = MOON_DIR.clone().multiplyScalar(MOON_DISTANCE);

  return (
    <group renderOrder={-1}>
      <mesh material={materials.dome} frustumCulled={false}>
        <sphereGeometry args={[DOME_RADIUS, 32, 16]} />
      </mesh>
      <points geometry={stars} material={materials.stars} frustumCulled={false} />
      <mesh position={moonPosition} material={materials.moon} onUpdate={(m) => m.lookAt(0, 0, 0)}>
        <circleGeometry args={[7, 32]} />
      </mesh>
    </group>
  );
}
