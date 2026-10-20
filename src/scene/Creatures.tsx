"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  AdditiveBlending,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  ConeGeometry,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshBasicMaterial,
  ShaderMaterial,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import planktonVert from "@/shaders/plankton.vert";
import planktonFrag from "@/shaders/plankton.frag";
import { entries } from "@/content";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useSceneStore } from "@/state/store";
import { beamRuntime } from "./beamState";
import { envRuntime } from "./envRuntime";
import { seaRuntime, waveHeight } from "./seaRuntime";
import { painted } from "./ships/models";
import { shipMaterial } from "./ships/shipMaterial";
import { shipRuntime } from "./ships/shipRuntime";

// Seconds between sightings, randomised within the range. Whales come twice as often in winter.
const WHALE_EVERY: [number, number] = [120, 240];
const DOLPHIN_EVERY: [number, number] = [90, 180];
const BREACH_S = 4.5;
const POD_S = 12;
const POD_SIZE = 4;
const TRAIL_POINTS = 40;
const TRAIL_STEP_S = 0.3;

const between = ([a, b]: [number, number]) => a + Math.random() * (b - a);

function whaleGeometry() {
  const body = new IcosahedronGeometry(1, 1);
  body.scale(1.6, 1.5, 6.5);
  const flukes = new BoxGeometry(4.2, 0.25, 1.4);
  flukes.translate(0, 0, 6.6);
  const fin = new ConeGeometry(0.4, 1.2, 4);
  fin.translate(0, 1.6, 1.5);
  return mergeGeometries([painted(body, "#3b4652"), painted(flukes, "#2f3943"), painted(fin, "#2f3943")])!;
}

function dolphinGeometry() {
  const body = new IcosahedronGeometry(1, 1);
  body.scale(0.45, 0.45, 1.2);
  const fin = new ConeGeometry(0.15, 0.45, 4);
  fin.translate(0, 0.5, 0.1);
  const tail = new BoxGeometry(0.9, 0.08, 0.3);
  tail.translate(0, 0, 1.25);
  return mergeGeometries([painted(body, "#6d7b88"), painted(fin, "#5b6874"), painted(tail, "#5b6874")])!;
}

const splashMaterial = new MeshBasicMaterial({ color: "#e8f2f8", transparent: true, depthWrite: false });

type Sighting = { at: number; x: number; z: number; heading: number };

type Trail = { g: BufferGeometry; material: ShaderMaterial; ages: Float32Array; head: number[] };
let trailState: Trail | null = null;

/** One point cloud for every ship's wake, refilled from a ring buffer per ship. */
function getTrail(): Trail {
  if (trailState) return trailState;
  const count = entries.length * TRAIL_POINTS;
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array(count * 3), 3));
  g.setAttribute("aAge", new BufferAttribute(new Float32Array(count).fill(1), 1));
  const material = new ShaderMaterial({
    vertexShader: planktonVert,
    fragmentShader: planktonFrag,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: { uPixelRatio: { value: 1 }, uTime: { value: 0 }, uStrength: { value: 0 } },
  });
  trailState = { g, material, ages: new Float32Array(count).fill(99), head: entries.map(() => 0) };
  return trailState;
}

/**
 * F12: rare sea life for visitors who stay a while. Loaded on demand, only
 * after the visitor has spent some time on the page.
 */
export default function Creatures({ immediate }: { immediate: boolean }) {
  const whale = useRef<Group>(null);
  const splash = useRef<Mesh>(null);
  const pod = useRef<Group>(null);
  const reducedMotion = useReducedMotion();
  const dpr = useThree((s) => s.viewport.dpr);

  const whaleGeo = useMemo(() => whaleGeometry(), []);
  const dolphinGeo = useMemo(() => dolphinGeometry(), []);

  const plan = useRef({
    nextWhale: immediate ? 3 : between(WHALE_EVERY) / 2,
    nextPod: immediate ? 8 : between(DOLPHIN_EVERY) / 2,
    whale: null as Sighting | null,
    pod: null as Sighting | null,
    lastTrail: 0,
  });

  const trail = getTrail();

  useFrame(({ clock }, delta) => {
    const trail = getTrail();
    const t = clock.elapsedTime;
    const p = plan.current;
    const winter = useSceneStore.getState().season === "winter";

    // Sightings happen in front of the beam, where the visitor is looking.
    const spot = (minDist: number, maxDist: number): Sighting => {
      const yaw = beamRuntime.yaw + (Math.random() - 0.5) * 0.5;
      const dist = minDist + Math.random() * (maxDist - minDist);
      return { at: t, x: -Math.sin(yaw) * dist, z: -Math.cos(yaw) * dist, heading: yaw + (Math.random() - 0.5) * 2 };
    };

    if (!p.whale && t > p.nextWhale) {
      p.whale = spot(50, 85);
      p.nextWhale = t + between(WHALE_EVERY) * (winter ? 0.5 : 1);
    }
    if (!p.pod && t > p.nextPod) {
      p.pod = spot(35, 60);
      p.nextPod = t + between(DOLPHIN_EVERY);
    }

    // Whale breach: rises nose first, arcs over and falls back in.
    const w = whale.current;
    if (w) {
      const s = p.whale;
      const k = s ? (t - s.at) / BREACH_S : 2;
      w.visible = k <= 1;
      if (s && k <= 1) {
        const surface = seaRuntime.tide.value * 0.9;
        const height = reducedMotion ? 3 : 11;
        w.position.set(s.x, surface - 7 + height * Math.sin(Math.PI * k), s.z);
        w.rotation.set(-1.2 + 2.4 * k, s.heading, reducedMotion ? 0 : k * 1.2, "YXZ");
      }
      if (s && k > 1.6) p.whale = null;
      const sp = splash.current;
      if (sp && s) {
        const after = (t - s.at - BREACH_S * 0.85) / 1.5;
        sp.visible = after > 0 && after < 1 && !reducedMotion;
        sp.position.set(s.x, waveHeight(s.x, s.z) + 0.1, s.z);
        sp.scale.setScalar(1 + after * 6);
        splashMaterial.opacity = 0.7 * (1 - after);
      } else if (sp) sp.visible = false;
    }

    // Dolphin pod: travels across, each one arcing out of the water in turn.
    const g = pod.current;
    if (g) {
      const s = p.pod;
      const k = s ? (t - s.at) / POD_S : 2;
      g.visible = k <= 1;
      if (s && k <= 1) {
        const fx = -Math.sin(s.heading);
        const fz = -Math.cos(s.heading);
        g.children.forEach((d, i) => {
          const along = (k - 0.5) * 40 - i * 2.2;
          const x = s.x + fx * along + (i % 2 ? 1.5 : -1.5);
          const z = s.z + fz * along;
          const phase = (t * 0.7 + i * 0.27) % 1;
          const leap = Math.max(0, Math.sin(Math.PI * 2 * phase));
          d.position.set(x, waveHeight(x, z) - 0.6 + leap * (reducedMotion ? 0.6 : 1.8), z);
          d.rotation.set(-Math.cos(Math.PI * 2 * phase) * 0.6 * (leap > 0 ? 1 : 0), s.heading, 0, "YXZ");
        });
      }
      if (s && k > 1) p.pod = null;
    }

    // Plankton glows in ship wakes, only on calm, dry, clear nights.
    const calmNight =
      envRuntime.daylight.value < 0.3 &&
      seaRuntime.seaState.value < 0.35 &&
      envRuntime.rain.value < 0.1 &&
      envRuntime.storm.value < 0.1;
    const m = trail.material;
    m.uniforms.uStrength!.value += ((calmNight ? 1 : 0) - m.uniforms.uStrength!.value) * Math.min(1, delta);
    m.uniforms.uTime!.value = t;
    m.uniforms.uPixelRatio!.value = dpr;

    const pos = trail.g.getAttribute("position") as BufferAttribute;
    const age = trail.g.getAttribute("aAge") as BufferAttribute;
    const step = t - p.lastTrail > TRAIL_STEP_S;
    if (step) p.lastTrail = t;
    entries.forEach((e, si) => {
      const ship = shipRuntime.get(e.id);
      for (let j = 0; j < TRAIL_POINTS; j++) {
        const i = si * TRAIL_POINTS + j;
        trail.ages[i]! += delta;
        age.setX(i, Math.min(1, trail.ages[i]! / (TRAIL_POINTS * TRAIL_STEP_S)));
      }
      if (step && ship) {
        const i = si * TRAIL_POINTS + trail.head[si]!;
        // Ships creep, so spread each point back along the hull's wake and to
        // the sides; it reads as glowing water rather than a dotted line.
        const back = ship.length * (0.5 + Math.random() * 1.4);
        const side = (Math.random() - 0.5) * ship.length * 0.6;
        const sx = Math.sin(ship.heading);
        const sz = Math.cos(ship.heading);
        const x = ship.anchor.x + sx * back + sz * side;
        const z = ship.anchor.z + sz * back - sx * side;
        // Half a metre up: the sampled height ignores the sideways Gerstner
        // shift, so points placed right on it often sit under the drawn surface.
        pos.setXYZ(i, x, waveHeight(x, z) + 0.5, z);
        trail.ages[i] = 0;
        trail.head[si] = (trail.head[si]! + 1) % TRAIL_POINTS;
      }
    });
    pos.needsUpdate = true;
    age.needsUpdate = true;
  });

  return (
    <group>
      <group ref={whale} name="whale" visible={false}>
        <mesh geometry={whaleGeo} material={shipMaterial()} />
      </group>
      <mesh ref={splash} material={splashMaterial} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[1.6, 2.2, 24]} />
      </mesh>
      <group ref={pod} name="dolphins" visible={false}>
        {Array.from({ length: POD_SIZE }, (_, i) => (
          <mesh key={i} geometry={dolphinGeo} material={shipMaterial()} />
        ))}
      </group>
      <points name="plankton" geometry={trail.g} material={trail.material} frustumCulled={false} renderOrder={4} />
    </group>
  );
}
