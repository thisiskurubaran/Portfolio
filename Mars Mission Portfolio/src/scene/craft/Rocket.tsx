"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  CylinderGeometry,
  DoubleSide,
  type Group,
  LatheGeometry,
  type Mesh,
  type PointLight,
  ShaderMaterial,
  Vector2,
} from "three";
import localVert from "@/shaders/local.vert";
import plumeFrag from "@/shaders/plume.frag";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useStore } from "@/state/store";
import { EVENTS, sampleAscent } from "../launch/ascentProfile";
import { local, smoothstep } from "../localRuntime";
import { ascent } from "../missionRuntime";
import { sky } from "../skyRuntime";
import { materials } from "./materials";
import { SC_RADIUS, SM_HEIGHT, Spacecraft, type SpacecraftHandle } from "./Spacecraft";

/**
 * Two stage launcher with the crew spacecraft and launch abort tower on
 * top. Built in rocket coordinates (metres, base of stage 1 at y = 0), then
 * shifted so the spacecraft joint sits on the local origin.
 */
const S1_TOP = 30;
const INTERSTAGE_TOP = 32;
const S2_TOP = 44;
const ADAPTER_TOP = S2_TOP + 1.5;
/** Height of the service module to capsule joint above the pad. */
export const JOINT_HEIGHT = ADAPTER_TOP + SM_HEIGHT;
const STAGE_RADIUS = 2;

function bell(throat: number, exit: number, length: number) {
  const pts: Vector2[] = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    pts.push(new Vector2(throat + (exit - throat) * Math.sqrt(t), -t * length));
  }
  return new LatheGeometry(pts, 24);
}

function plumeGeometry() {
  // Unit length, pointing down from the nozzle at y = 0.
  const g = new CylinderGeometry(0.35, 1, 1, 32, 1, true);
  g.translate(0, -0.5, 0);
  return g;
}

const plumeShared = { uTime: { value: 0 }, uFlicker: { value: 1 } };
const plumeIntensity: [{ value: number }, { value: number }, { value: number }] = [
  { value: 0 },
  { value: 0 },
  { value: 0 },
];

function plumeMaterial(intensity: { value: number }) {
  return new ShaderMaterial({
    vertexShader: localVert,
    fragmentShader: plumeFrag,
    uniforms: { ...plumeShared, uIntensity: intensity },
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
  });
}

/** Seconds since liftoff, or -1 before launch. */
function missionTime(): number {
  const phase = useStore.getState().phase;
  if (phase === "pad" || phase === "countdown") return -1;
  return (sky.simMs - ascent.liftoffMs) / 1000;
}

export function Rocket() {
  const reduced = useReducedMotion();
  const stack = useRef<Group>(null);
  const stage1 = useRef<Group>(null);
  const stage2 = useRef<Group>(null);
  const tower = useRef<Group>(null);
  const plume1 = useRef<Mesh>(null);
  const plume2 = useRef<Mesh>(null);
  const plume3 = useRef<Mesh>(null);
  const glow = useRef<PointLight>(null);
  const craft = useRef<SpacecraftHandle>(null);

  const geo = useMemo(
    () => ({
      engine: bell(0.18, 0.55, 1.6),
      upperEngine: bell(0.2, 1.0, 2.2),
      plume: plumeGeometry(),
    }),
    [],
  );
  const plumes = useMemo(() => plumeIntensity.map(plumeMaterial), []);

  useFrame((state) => {
    const t = missionTime();
    const s = sampleAscent(Math.max(t, 0));
    plumeShared.uTime.value = state.clock.elapsedTime;
    plumeShared.uFlicker.value = reduced ? 0 : 1;

    if (stack.current) {
      // Tilt toward east by the pitch program, then hang the stack from the joint.
      const tilt = t < 0 ? 0 : Math.PI / 2 - s.pitch;
      stack.current.rotation.z = -tilt;
      stack.current.position.set(-Math.sin(tilt) * JOINT_HEIGHT, -Math.cos(tilt) * JOINT_HEIGHT, 0);
    }

    // Stage 1 falls back once its engines stop, first pushed by separation
    // motors, then left behind as stage 2 accelerates away.
    if (stage1.current) {
      const dt = t - EVENTS.stageSeparation;
      const gone = dt > 90;
      stage1.current.visible = !gone;
      if (dt > 0 && !gone) {
        const burn = Math.max(dt - (EVENTS.secondStageIgnition - EVENTS.stageSeparation), 0);
        stage1.current.position.y = -(0.6 * dt + 0.5 * 1.2 * dt * dt + 0.5 * 12 * burn * burn);
        stage1.current.rotation.x = 0.004 * dt * dt;
      } else if (dt <= 0) {
        stage1.current.position.set(0, 0, 0);
        stage1.current.rotation.set(0, 0, 0);
      }
    }

    // The abort tower is no longer needed once the air thins; its own motor
    // pulls it up and off to the side.
    if (tower.current) {
      const dt = t - EVENTS.towerJettison;
      tower.current.visible = dt < 30;
      tower.current.position.set(dt > 0 ? 0.5 * 6 * dt * dt : 0, dt > 0 ? 0.5 * 40 * dt * dt : 0, 0);
    }

    // Stage 2 drifts back slowly after spacecraft separation.
    if (stage2.current) {
      const dt = t - EVENTS.spacecraftSeparation;
      stage2.current.visible = dt < 600;
      // Pushed off by springs, mostly straight back, with a slight sideways drift.
      stage2.current.position.set(0, dt > 0 ? -(0.3 * dt) : 0, dt > 0 ? -0.05 * dt : 0);
      stage2.current.rotation.x = dt > 0 ? 0.002 * dt : 0;
    }

    craft.current?.setDeploy(smoothstep(EVENTS.arraysDeploy, EVENTS.arraysDeploy + 10, t));

    // Exhaust expands as outside pressure drops; in vacuum it fans out wide.
    const vac = 1 - local.air.value;
    const s1On = t >= 0 && t < EVENTS.meco;
    const s2On = t >= EVENTS.secondStageIgnition && t < EVENTS.seco;
    // Engines spool up over the first second rather than snapping on.
    const spool = smoothstep(-0.3, 0.8, t);
    if (plume1.current) {
      plume1.current.visible = s1On;
      plume1.current.scale.set(2.4 + 6 * vac, 26 + 40 * vac, 2.4 + 6 * vac);
      plumeIntensity[0].value = 16 * spool;
    }
    if (plume2.current) {
      plume2.current.visible = s2On;
      plume2.current.scale.set(1.2 + 10 * vac, 14 + 50 * vac, 1.2 + 10 * vac);
      plumeIntensity[1].value = 6;
    }
    // Departure burn on the service module engine. Hydrogen and oxygen burn
    // to nearly clear water vapour, so in vacuum the plume is only a faint glow.
    if (plume3.current) {
      const burning = useStore.getState().phase === "tmi";
      plume3.current.visible = burning;
      plume3.current.scale.set(1.6, 7, 1.6);
      plumeIntensity[2].value = burning ? 2.5 : 0;
    }
    if (glow.current) {
      // The flame lights up the stack and the pad, strongest near the ground.
      glow.current.intensity = s1On ? 5e4 * spool * local.air.value : 0;
    }
  });

  return (
    <group ref={stack}>
      <group ref={stage1}>
        <mesh material={materials.paint} position={[0, S1_TOP / 2, 0]}>
          <cylinderGeometry args={[STAGE_RADIUS, STAGE_RADIUS, S1_TOP, 40]} />
        </mesh>
        <mesh material={materials.black} position={[0, (S1_TOP + INTERSTAGE_TOP) / 2, 0]}>
          <cylinderGeometry args={[STAGE_RADIUS, STAGE_RADIUS, INTERSTAGE_TOP - S1_TOP, 40]} />
        </mesh>
        <mesh material={materials.black} position={[0, 1.5, 0]}>
          <cylinderGeometry args={[STAGE_RADIUS + 0.02, STAGE_RADIUS + 0.02, 3, 40]} />
        </mesh>
        {[
          [0.9, 0.9],
          [-0.9, 0.9],
          [0.9, -0.9],
          [-0.9, -0.9],
        ].map(([x, z]) => (
          <mesh key={`${x}${z}`} geometry={geo.engine} material={materials.nozzle} position={[x!, 0, z!]} />
        ))}
        <mesh ref={plume1} geometry={geo.plume} material={plumes[0]} position={[0, -1.4, 0]} />
        <pointLight ref={glow} position={[0, -12, 0]} color="#ffb070" intensity={0} decay={2} />
      </group>

      <group ref={stage2}>
        <mesh material={materials.paint} position={[0, (INTERSTAGE_TOP + S2_TOP) / 2, 0]}>
          <cylinderGeometry args={[STAGE_RADIUS, STAGE_RADIUS, S2_TOP - INTERSTAGE_TOP, 40]} />
        </mesh>
        <mesh material={materials.paint} position={[0, (S2_TOP + ADAPTER_TOP) / 2, 0]}>
          <cylinderGeometry args={[SC_RADIUS + 0.05, STAGE_RADIUS, ADAPTER_TOP - S2_TOP, 40]} />
        </mesh>
        <mesh geometry={geo.upperEngine} material={materials.nozzle} position={[0, INTERSTAGE_TOP, 0]} />
        <mesh ref={plume2} geometry={geo.plume} material={plumes[1]} position={[0, INTERSTAGE_TOP - 2.1, 0]} />
      </group>

      <group position={[0, JOINT_HEIGHT, 0]}>
        <Spacecraft ref={craft} />
        <mesh ref={plume3} geometry={geo.plume} material={plumes[2]} position={[0, -SM_HEIGHT - 1.5, 0]} />
        <group ref={tower}>
          <mesh material={materials.paint} position={[0, 4.3, 0]}>
            <cylinderGeometry args={[0.35, 0.9, 1.6, 24]} />
          </mesh>
          <mesh material={materials.frame} position={[0, 6.6, 0]}>
            <cylinderGeometry args={[0.28, 0.28, 3, 16]} />
          </mesh>
          <mesh material={materials.paint} position={[0, 8.8, 0]}>
            <coneGeometry args={[0.3, 1.4, 16]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
