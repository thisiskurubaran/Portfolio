"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  BackSide,
  BoxGeometry,
  BufferGeometry,
  CircleGeometry,
  Color,
  CylinderGeometry,
  Float32BufferAttribute,
  type Group,
  InstancedBufferAttribute,
  type InstancedMesh,
  Matrix4,
  type Mesh,
  PlaneGeometry,
  Quaternion,
  ShaderMaterial,
  Vector3,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import localVert from "@/shaders/local.vert";
import skydomeFrag from "@/shaders/skydome.frag";
import groundFrag from "@/shaders/ground.frag";
import smokeVert from "@/shaders/smoke.vert";
import smokeFrag from "@/shaders/smoke.frag";
import { useConditions } from "@/state/conditions";
import { useStore } from "@/state/store";
import { JOINT_HEIGHT } from "../craft/Rocket";
import { materials } from "../craft/materials";
import { local, smoothstep } from "../localRuntime";
import { ascent } from "../missionRuntime";
import { sky } from "../skyRuntime";

const GROUND_RADIUS = 40_000;
const DOME_RADIUS = 30_000;
const TOWER_X = -13;
const TOWER_HEIGHT = 66;

const sunColor = { value: new Color() };

export const EARTH_SKY = {
  uZenith: { value: new Color(0.1, 0.24, 0.62) },
  uHorizon: { value: new Color(0.55, 0.66, 0.82) },
  uSunset: { value: new Color(1.0, 0.42, 0.14) },
  uHalo: { value: new Color(1.0, 0.9, 0.75) },
};
const CLEAR = { zenith: new Color(0.1, 0.24, 0.62), horizon: new Color(0.55, 0.66, 0.82) };
const OVERCAST = new Color(0.5, 0.53, 0.58);
const groundOpacity = { value: 1 };

function groundGeometry() {
  const g = new CircleGeometry(GROUND_RADIUS, 96);
  g.rotateX(-Math.PI / 2);
  // UVs carry ground metres (east, south) so the shader's patterns are fixed to the land.
  const pos = g.getAttribute("position");
  const uv: number[] = [];
  for (let i = 0; i < pos.count; i++) uv.push(pos.getX(i), pos.getZ(i));
  g.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  return g;
}

/** Service tower: four columns with cross bracing every 6 m, merged into one mesh. */
function towerGeometry() {
  const parts: BufferGeometry[] = [];
  const half = 3;
  for (const [x, z] of [
    [-half, -half],
    [half, -half],
    [-half, half],
    [half, half],
  ]) {
    const c = new BoxGeometry(0.6, TOWER_HEIGHT, 0.6);
    c.translate(x!, TOWER_HEIGHT / 2, z!);
    parts.push(c);
  }
  for (let y = 3; y < TOWER_HEIGHT; y += 6) {
    for (const [w, d, x, z] of [
      [2 * half, 0.35, 0, -half],
      [2 * half, 0.35, 0, half],
      [0.35, 2 * half, -half, 0],
      [0.35, 2 * half, half, 0],
    ]) {
      const b = new BoxGeometry(w!, 0.35, d!);
      b.translate(x!, y, z!);
      parts.push(b);
    }
  }
  // Crew access arm reaching to the capsule hatch.
  const arm = new BoxGeometry(Math.abs(TOWER_X) - 2.6 - half, 2.4, 2);
  arm.translate(half + (Math.abs(TOWER_X) - 2.6 - half) / 2, JOINT_HEIGHT + 1.5, 0);
  parts.push(arm);
  const merged = mergeGeometries(parts)!;
  merged.translate(TOWER_X, 0, 0);
  return merged;
}

/** Lightning masts around the pad, as at real launch complexes. */
function mastGeometry() {
  const parts: BufferGeometry[] = [];
  for (const [x, z] of [
    [-100, 0],
    [100, 0],
    [0, -100],
    [0, 100],
  ]) {
    const m = new CylinderGeometry(0.5, 1.1, 110, 8);
    m.translate(x!, 55, z!);
    parts.push(m);
  }
  return mergeGeometries(parts)!;
}

const SMOKE_COUNT = 90;
const mat = new Matrix4();
const pos = new Vector3();
const scale = new Vector3();
const noRotation = new Quaternion();
const nightFloor = new Color(0.03, 0.03, 0.035);
const flameColor = new Color(1.0, 0.55, 0.25);
const flameLit = new Color();
const smokeColor = { value: new Color() };

type Puff = { spawn: number; dir: Vector3; speed: number; lift: number; size: number };

function makePuffs(): Puff[] {
  // Deterministic spread so every visit looks the same.
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  return Array.from({ length: SMOKE_COUNT }, () => {
    // The flame trench vents to the south (+z); some exhaust also spills around the pad.
    const trench = rand() < 0.7;
    const angle = trench ? Math.PI / 2 + (rand() - 0.5) * 0.7 : rand() * Math.PI * 2;
    return {
      spawn: rand() * 14 - 0.5,
      dir: new Vector3(Math.cos(angle), 0, Math.sin(angle)),
      speed: trench ? 60 + rand() * 80 : 20 + rand() * 30,
      lift: 1.5 + rand() * 3,
      size: 8 + rand() * 10,
    };
  });
}

function Smoke() {
  const mesh = useRef<InstancedMesh>(null);
  const puffs = useMemo(() => makePuffs(), []);
  const geometry = useMemo(() => {
    const g = new PlaneGeometry(1, 1);
    g.setAttribute("aAlpha", new InstancedBufferAttribute(new Float32Array(SMOKE_COUNT), 1));
    return g;
  }, []);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: smokeVert,
        fragmentShader: smokeFrag,
        uniforms: { uColor: smokeColor },
        transparent: true,
        depthWrite: false,
      }),
    [],
  );

  useFrame(() => {
    const m = mesh.current;
    if (!m) return;
    const phase = useStore.getState().phase;
    const t = phase === "pad" || phase === "countdown" ? -1 : (sky.simMs - ascent.liftoffMs) / 1000;
    const alpha = geometry.getAttribute("aAlpha") as InstancedBufferAttribute;
    puffs.forEach((p, i) => {
      const age = t - p.spawn;
      if (age <= 0) {
        alpha.setX(i, 0);
        mat.makeScale(0, 0, 0);
      } else {
        // Exhaust shoots out of the trench and slows as it mixes with air.
        const travel = p.speed * 8 * (1 - Math.exp(-age / 8));
        pos.copy(p.dir).multiplyScalar(travel + 6);
        pos.y = 4 + p.lift * age + 0.02 * age * age;
        const s = p.size + age * 2.2;
        scale.set(s, s, s);
        mat.compose(pos, noRotation, scale);
        alpha.setX(i, 0.85 * (1 - smoothstep(60, 240, age)));
      }
      m.setMatrixAt(i, mat);
    });
    m.instanceMatrix.needsUpdate = true;
    alpha.needsUpdate = true;
    // Lit by the Sun by day, by the flame at liftoff, nearly black at night otherwise.
    const flame = t >= 0 && t < 12 ? 1 - t / 12 : 0;
    smokeColor.value
      .copy(local.sunColor)
      .multiplyScalar(0.75 * local.daylight.value * (0.4 + 0.6 * Math.max(local.sunDir.y, 0)))
      .add(nightFloor)
      .add(flameLit.copy(flameColor).multiplyScalar(flame * 0.8));
  });

  return <instancedMesh ref={mesh} args={[geometry, material, SMOKE_COUNT]} frustumCulled={false} />;
}

/**
 * The launch complex: ground, pad structures, smoke and the sky dome. Fixed
 * to the ground, which drops away under the rocket as it climbs, and faded
 * out on the way up once the sky layer's Earth takes over.
 */
export function LaunchSite() {
  const ground = useRef<Group>(null);
  const dome = useRef<Mesh>(null);
  const root = useRef<Group>(null);
  const camera = useThree((s) => s.camera);

  const geo = useMemo(
    () => ({ ground: groundGeometry(), tower: towerGeometry(), masts: mastGeometry() }),
    [],
  );
  const mats = useMemo(
    () => ({
      dome: new ShaderMaterial({
        vertexShader: localVert,
        fragmentShader: skydomeFrag,
        uniforms: {
          uSunDir: local.sunDirUniform,
          uDaylight: local.daylight,
          uAir: local.air,
          ...EARTH_SKY,
        },
        side: BackSide,
        transparent: true,
        depthWrite: false,
      }),
      ground: new ShaderMaterial({
        vertexShader: localVert,
        fragmentShader: groundFrag,
        uniforms: {
          uSunDir: local.sunDirUniform,
          uSunColor: sunColor,
          uDaylight: local.daylight,
          uOpacity: groundOpacity,
        },
        transparent: true,
      }),
    }),
    [],
  );

  useFrame(() => {
    const phase = useStore.getState().phase;
    const onEarth = phase === "pad" || phase === "countdown" || phase === "ascent";
    if (root.current) root.current.visible = onEarth;
    if (!onEarth) return;
    sunColor.value.copy(local.sunColor);
    const altKm = local.altitudeM / 1000;
    // F02: the pad's real cloud cover greys the sky and softens the Sun,
    // until the rocket climbs through the deck (most cloud is under 10 km).
    const pad = useConditions.getState().conditions?.pad.weather;
    const today = Math.abs(sky.simMs - Date.now()) < 3 * 3_600_000;
    const cloud = pad && today ? pad.cloudCover * (1 - smoothstep(2, 10, altKm)) : 0;
    EARTH_SKY.uZenith.value.copy(CLEAR.zenith).lerp(OVERCAST, cloud * 0.85);
    EARTH_SKY.uHorizon.value.copy(CLEAR.horizon).lerp(OVERCAST, cloud * 0.7);
    sunColor.value.multiplyScalar(1 - cloud * 0.6);
    groundOpacity.value = 1 - smoothstep(12, 40, altKm);
    if (ground.current) {
      ground.current.visible = groundOpacity.value > 0;
      ground.current.position.set(-local.downrangeM, -(JOINT_HEIGHT + local.altitudeM), 0);
    }
    if (dome.current) {
      dome.current.position.copy(camera.position);
      dome.current.visible = local.air.value > 0.002;
    }
  });

  return (
    <group ref={root}>
      <mesh ref={dome} material={mats.dome} renderOrder={-10}>
        <sphereGeometry args={[DOME_RADIUS, 48, 24]} />
      </mesh>
      <group ref={ground}>
        <mesh geometry={geo.ground} material={mats.ground} renderOrder={-5} />
        <mesh geometry={geo.tower} material={materials.steel} />
        <mesh geometry={geo.masts} material={materials.steel} />
        <Smoke />
      </group>
    </group>
  );
}

