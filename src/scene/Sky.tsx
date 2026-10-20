"use client";

import { useMemo, useRef } from "react";
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

export function Sky() {
  const dpr = useThree((s) => s.viewport.dpr);
  const reducedMotion = useReducedMotion();
  const starsRef = useRef<ShaderMaterial>(null);

  const stars = useMemo(() => starGeometry(), []);
  const skyUniforms = useMemo(
    () => ({
      uHorizon: envRuntime.horizon,
      uZenith: envRuntime.zenith,
      uMoonDir: { value: MOON_DIR },
      uMoonLight: { value: PALETTES.night.light },
      uMoonVisibility: envRuntime.moonVisibility,
      uSunDir: envRuntime.sunDir,
      uGlowColor: envRuntime.glowColor,
      uGlow: envRuntime.glow,
    }),
    [],
  );
  const starUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: 1 },
      uTwinkle: { value: 1 },
      // Fades with daylight and cloud cover.
      uVisibility: envRuntime.starVisibility,
    }),
    [],
  );
  const moonUniforms = useMemo(
    () => ({
      uPhase: envRuntime.moonPhase,
      uVisibility: envRuntime.moonVisibility,
      uColor: { value: new Color("#e6ecf5") },
    }),
    [],
  );

  useFrame((_, delta) => {
    const m = starsRef.current;
    if (!m) return;
    m.uniforms.uTime!.value += delta;
    m.uniforms.uPixelRatio!.value = dpr;
    m.uniforms.uTwinkle!.value = reducedMotion ? 0 : 1;
  });

  const moonPosition = MOON_DIR.clone().multiplyScalar(MOON_DISTANCE);

  return (
    <group renderOrder={-1}>
      <mesh frustumCulled={false}>
        <sphereGeometry args={[DOME_RADIUS, 32, 16]} />
        <shaderMaterial
          vertexShader={skyVert}
          fragmentShader={skyFrag}
          uniforms={skyUniforms}
          side={BackSide}
          depthWrite={false}
        />
      </mesh>
      <points geometry={stars} frustumCulled={false}>
        <shaderMaterial
          ref={starsRef}
          vertexShader={starsVert}
          fragmentShader={starsFrag}
          uniforms={starUniforms}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>
      <mesh position={moonPosition} onUpdate={(m) => m.lookAt(0, 0, 0)}>
        <circleGeometry args={[7, 32]} />
        <shaderMaterial
          vertexShader={moonVert}
          fragmentShader={moonFrag}
          uniforms={moonUniforms}
          transparent
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
