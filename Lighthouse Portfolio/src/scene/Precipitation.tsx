"use client";

import { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { BufferAttribute, BufferGeometry, Color, ShaderMaterial, Vector2, Vector3 } from "three";
import rainVert from "@/shaders/rain.vert";
import rainFrag from "@/shaders/rain.frag";
import snowVert from "@/shaders/snow.vert";
import snowFrag from "@/shaders/snow.frag";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { hash3 } from "./bake";
import { envRuntime } from "./envRuntime";
import { seaRuntime } from "./seaRuntime";

const RAIN_DROPS = 7000;
const SNOW_FLAKES = 4000;
// Metres around the camera that hold drops. Bigger reads deeper but costs fill rate.
const BOX = new Vector3(90, 45, 90);
const WIND_PUSH = 6;
const REDUCED_SPEED = 0.4;

// Per frame values. There is one weather layer, so module scope is fine.
const time = { value: 0 };
const center = { value: new Vector3() };
const wind = { value: new Vector2() };
const rainAmount = { value: 0 };
const snowAmount = { value: 0 };
const pixelRatio = { value: 1 };
const rainLength = { value: 1.1 };

function dropGeometry(count: number, streaks: boolean): BufferGeometry {
  const per = streaks ? 2 : 1;
  const seeds = new Float32Array(count * per * 3);
  const ends = new Float32Array(count * per);
  const ranks = new Float32Array(count * per);
  for (let i = 0; i < count; i++) {
    const seed = [hash3(i, 0.1, 5.3), hash3(i, 7.7, 1.9), hash3(i, 3.1, 9.4)];
    const rank = hash3(i, 2.2, 6.6);
    for (let e = 0; e < per; e++) {
      const v = i * per + e;
      seeds.set(seed, v * 3);
      ends[v] = e;
      ranks[v] = rank;
    }
  }
  const g = new BufferGeometry();
  // Position is unused (the shader places drops) but three expects it for draw counts.
  g.setAttribute("position", new BufferAttribute(new Float32Array(count * per * 3), 3));
  g.setAttribute("aSeed", new BufferAttribute(seeds, 3));
  g.setAttribute("aEnd", new BufferAttribute(ends, 1));
  g.setAttribute("aRank", new BufferAttribute(ranks, 1));
  return g;
}

/** Rain streaks and snow flakes, each a single draw call, scaled by the weather. */
export function Precipitation() {
  const reducedMotion = useReducedMotion();
  const dpr = useThree((s) => s.viewport.dpr);

  const rain = useMemo(
    () => ({
      geometry: dropGeometry(RAIN_DROPS, true),
      material: new ShaderMaterial({
        vertexShader: rainVert,
        fragmentShader: rainFrag,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: time,
          uCenter: center,
          uBox: { value: BOX },
          uWind: wind,
          uFall: { value: 24 },
          uLength: rainLength,
          uAmount: rainAmount,
          uColor: { value: new Color("#b8c8dc") },
          uOpacity: { value: 0.35 },
        },
      }),
    }),
    [],
  );

  const snow = useMemo(
    () => ({
      geometry: dropGeometry(SNOW_FLAKES, false),
      material: new ShaderMaterial({
        vertexShader: snowVert,
        fragmentShader: snowFrag,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: time,
          uCenter: center,
          uBox: { value: BOX },
          uWind: wind,
          uFall: { value: 2.2 },
          uAmount: snowAmount,
          uPixelRatio: pixelRatio,
          uOpacity: { value: 0.85 },
        },
      }),
    }),
    [],
  );

  useFrame(({ camera }, delta) => {
    time.value += delta * (reducedMotion ? REDUCED_SPEED : 1);
    center.value.copy(camera.position);
    const w = seaRuntime.windDir.value;
    // Storm rain comes in long slanted sheets.
    const push = WIND_PUSH * (0.3 + seaRuntime.seaState.value) * (1 + envRuntime.storm.value * 1.5);
    wind.value.set(w.x * push, w.y * push);
    rainLength.value = 1.1 + envRuntime.storm.value * 1.8;
    rainAmount.value = envRuntime.rain.value;
    snowAmount.value = envRuntime.snow.value;
    pixelRatio.value = dpr;
  });

  return (
    <group>
      <lineSegments geometry={rain.geometry} material={rain.material} frustumCulled={false} renderOrder={5} />
      <points geometry={snow.geometry} material={snow.material} frustumCulled={false} renderOrder={5} />
    </group>
  );
}
