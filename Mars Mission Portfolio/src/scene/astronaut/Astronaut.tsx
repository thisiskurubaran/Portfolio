"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { type Group, MeshStandardMaterial, Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { guide } from "@/content/guide";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useStore } from "@/state/store";
import { materials } from "../craft/materials";
import { followTarget, resetFollow } from "../follow";
import { MARS_G } from "../surface/roverSim";
import { GROUND_Y, surfaceWorld } from "../surface/Surface";
import { surface } from "../surfaceRuntime";
import {
  astro,
  astroInput,
  EVA_THRUST,
  RUN_SPEED,
  setAstroMode,
  SUIT_HEIGHT,
  TETHER_M,
  WALK_SPEED,
} from "./astronautRuntime";
import { type AstronautHandle, AstronautModel } from "./AstronautModel";
import {
  BOARD_AT,
  HATCH_AT,
  LIFT_AT,
  MARS_SPAWN,
  objective,
  PAD_GROUND,
  PAD_SPAWN,
  PODS,
  progress,
  updateGuide,
} from "./guideRuntime";

const EARTH_G = 9.81;
const JUMP_V = 3;
const labels = {
  ...(Object.fromEntries(Object.entries(guide.steps).map(([k, v]) => [k, v.act])) as Record<keyof typeof guide.steps, string>),
  place: guide.openHere,
};

type Circle = { x: number; z: number; r: number };
type Box = { x0: number; x1: number; z0: number; z1: number };

/** What stands on the pad: the rocket, the service tower, the masts and the board. */
const PAD_CIRCLES: Circle[] = [
  { x: 0, z: 0, r: 2.6 },
  { x: -100, z: 0, r: 1.5 },
  { x: 100, z: 0, r: 1.5 },
  { x: 0, z: -100, r: 1.5 },
  { x: 0, z: 100, r: 1.5 },
  { x: BOARD_AT.x, z: BOARD_AT.z, r: 0.5 },
];
const PAD_BOXES: Box[] = [{ x0: -16.4, x1: -9.6, z0: -3.4, z1: 3.4 }];
/** The ship as a few spheres along its axis, for bumping into on EVA. */
const SHIP_SPHERES = [-6, -3, 0, 2.5].map((x) => ({ c: new Vector3(x, 0, 0), r: 2.7 }));

const fwd = new Vector3();
const right = new Vector3();
const want = new Vector3();
const thrust = new Vector3();
const focus = new Vector3();
const start = new Vector3();
const UP = new Vector3(0, 1, 0);

function pushOutCircle(p: Vector3, c: Circle, pad: number): void {
  const dx = p.x - c.x;
  const dz = p.z - c.z;
  const d = Math.hypot(dx, dz);
  const min = c.r + pad;
  if (d < min && d > 1e-6) {
    p.x = c.x + (dx / d) * min;
    p.z = c.z + (dz / d) * min;
  }
}

function pushOutBox(p: Vector3, b: Box, pad: number): void {
  const x0 = b.x0 - pad;
  const x1 = b.x1 + pad;
  const z0 = b.z0 - pad;
  const z1 = b.z1 + pad;
  if (p.x <= x0 || p.x >= x1 || p.z <= z0 || p.z >= z1) return;
  // Out through the nearest face.
  const d = [p.x - x0, x1 - p.x, p.z - z0, z1 - p.z];
  const i = d.indexOf(Math.min(...d));
  if (i === 0) p.x = x0;
  else if (i === 1) p.x = x1;
  else if (i === 2) p.z = z0;
  else p.z = z1;
}

/** Ground height and obstacles where the astronaut is walking. */
function ground(phase: string, x: number, z: number): number {
  if (phase === "surface") {
    const t = surfaceWorld.terrain;
    return GROUND_Y + (t ? t.height(x, z) : 0);
  }
  return PAD_GROUND;
}

function collide(phase: string, p: Vector3): void {
  const pad = 0.35;
  if (phase === "surface") {
    const t = surfaceWorld.terrain;
    if (t) for (const r of t.rocks) if (r.size >= 0.6) pushOutCircle(p, { x: r.x, z: r.z, r: r.size * 0.6 }, pad);
    pushOutCircle(p, { x: 0, z: 0, r: 3 }, pad);
    if (!progress.inRover) pushOutCircle(p, { x: surface.rover.x, z: surface.rover.z, r: 2.6 }, pad);
    return;
  }
  for (const c of PAD_CIRCLES) pushOutCircle(p, c, pad);
  for (const b of PAD_BOXES) pushOutBox(p, b, pad);
}

function walk(phase: string, camera: { position: Vector3 }, target: Vector3, dt: number): void {
  fwd.copy(target).sub(camera.position).setY(0);
  if (fwd.lengthSq() < 1e-6) fwd.set(1, 0, 0);
  fwd.normalize();
  right.crossVectors(fwd, UP);
  const speed = astroInput.down ? RUN_SPEED : WALK_SPEED;
  want.copy(fwd).multiplyScalar(astroInput.forward).addScaledVector(right, astroInput.right);
  if (want.lengthSq() > 1) want.normalize();
  want.multiplyScalar(speed);
  // Suits are heavy: speed changes take a moment, more so in the air.
  const grip = astro.onGround ? 8 : 1.5;
  astro.vel.x += (want.x - astro.vel.x) * Math.min(grip * dt, 1);
  astro.vel.z += (want.z - astro.vel.z) * Math.min(grip * dt, 1);
  const g = phase === "surface" ? MARS_G : EARTH_G;
  if (astro.onGround && astroInput.up) {
    astro.vel.y = JUMP_V;
    astro.onGround = false;
  }
  astro.vel.y -= g * dt;
  astro.pos.addScaledVector(astro.vel, dt);
  collide(phase, astro.pos);
  const floor = ground(phase, astro.pos.x, astro.pos.z);
  if (astro.pos.y <= floor) {
    astro.pos.y = floor;
    astro.vel.y = 0;
    astro.onGround = true;
  } else if (astro.pos.y - floor > 0.05) {
    astro.onGround = false;
  }
  const flat = Math.hypot(astro.vel.x, astro.vel.z);
  if (flat > 0.2) {
    const yaw = Math.atan2(-astro.vel.z, astro.vel.x);
    let d = yaw - astro.yaw;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    astro.yaw += d * Math.min(10 * dt, 1);
  }
  if (astro.onGround) astro.stride = (astro.stride + (flat * dt) / 1.4) % 1;
}

function eva(camera: { position: Vector3 }, target: Vector3, dt: number): boolean {
  fwd.copy(target).sub(camera.position).normalize();
  right.crossVectors(fwd, UP).normalize();
  thrust
    .copy(fwd)
    .multiplyScalar(astroInput.forward)
    .addScaledVector(right, astroInput.right)
    .addScaledVector(UP, (astroInput.up ? 1 : 0) - (astroInput.down ? 1 : 0));
  let firing = false;
  if (thrust.lengthSq() > 0 && astro.evaDv > 0) {
    thrust.normalize().multiplyScalar(EVA_THRUST * dt);
    astro.vel.add(thrust);
    astro.evaDv = Math.max(astro.evaDv - EVA_THRUST * dt, 0);
    firing = true;
  } else if (astroInput.stabilise && astro.vel.lengthSq() > 1e-4 && astro.evaDv > 0) {
    // Fire against the drift until it stops.
    const dv = Math.min(EVA_THRUST * dt, astro.vel.length());
    astro.vel.addScaledVector(astro.vel.clone().normalize(), -dv);
    astro.evaDv = Math.max(astro.evaDv - dv, 0);
    firing = true;
  }
  // No air, no friction: the astronaut keeps drifting until they thrust.
  astro.pos.addScaledVector(astro.vel, dt);
  // The tether goes taut at full length and stops the drift outward.
  want.copy(astro.pos).sub(astro.anchor);
  const d = want.length();
  if (d > TETHER_M) {
    want.divideScalar(d);
    astro.pos.copy(astro.anchor).addScaledVector(want, TETHER_M);
    const out = astro.vel.dot(want);
    if (out > 0) astro.vel.addScaledVector(want, -out * 1.3);
  }
  for (const s of SHIP_SPHERES) {
    want.copy(astro.pos).sub(s.c);
    const l = want.length();
    if (l < s.r && l > 1e-6) {
      astro.pos.copy(s.c).addScaledVector(want.divideScalar(l), s.r);
      const into = astro.vel.dot(want);
      if (into < 0) astro.vel.addScaledVector(want, -into * 1.2);
    }
  }
  if (firing && thrust.lengthSq() > 0) {
    const yaw = Math.atan2(-fwd.z, fwd.x);
    let dy = yaw - astro.yaw;
    dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    astro.yaw += dy * Math.min(3 * dt, 1);
  }
  return firing;
}

function Marker() {
  const g = useRef<Group>(null);
  const reduced = useReducedMotion();
  useFrame(({ clock }) => {
    const m = g.current;
    if (!m) return;
    const t = objective.current.target;
    m.visible = !!t && useStore.getState().astroMode !== "aboard";
    if (!t) return;
    m.position.copy(t);
    const bob = reduced ? 0 : Math.sin(clock.elapsedTime * 2) * 0.25;
    m.children[1]?.position.set(0, 3.2 + bob, 0);
    if (!reduced) m.rotation.y = clock.elapsedTime * 0.8;
  });
  return (
    <group ref={g} visible={false}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} material={markerMaterial}>
        <ringGeometry args={[1.1, 1.35, 40]} />
      </mesh>
      <mesh rotation={[Math.PI, 0, 0]} material={markerMaterial}>
        <coneGeometry args={[0.35, 0.8, 4]} />
      </mesh>
    </group>
  );
}

const markerMaterial = new MeshStandardMaterial({ color: "#ffb36b", emissive: "#ffb36b", emissiveIntensity: 2.5 });
const podGlow = new MeshStandardMaterial({ color: "#7fc8ff", emissive: "#7fc8ff", emissiveIntensity: 1.6 });
const boardFace = new MeshStandardMaterial({ color: "#1d2433", emissive: "#2d4a7a", emissiveIntensity: 0.6 });

/** The mission board by the pad and the lift door at the foot of the tower. */
function PadProps() {
  const g = useRef<Group>(null);
  useFrame(() => {
    if (g.current) g.current.visible = useStore.getState().phase === "pad";
  });
  return (
    <group ref={g}>
      <group position={BOARD_AT}>
        <mesh material={materials.steel} position={[0, 1.1, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 2.2, 8]} />
        </mesh>
        <mesh material={boardFace} position={[0, 2.2, 0]} rotation={[0, Math.PI / 4, 0]}>
          <boxGeometry args={[0.08, 1.2, 2]} />
        </mesh>
      </group>
      <mesh material={boardFace} position={[LIFT_AT.x - 0.35, PAD_GROUND + 1.2, LIFT_AT.z]}>
        <boxGeometry args={[0.1, 2.4, 1.4]} />
      </mesh>
    </group>
  );
}

/** One instrument pod per skill group, on a ring ahead of the ship in Earth orbit. */
function Pods() {
  const g = useRef<Group>(null);
  const reduced = useReducedMotion();
  const open = useStore((s) => s.openSkill);
  const mode = useStore((s) => s.astroMode);
  const phase = useStore((s) => s.phase);
  useFrame(({ clock }) => {
    if (!g.current || reduced) return;
    g.current.children.forEach((c, i) => {
      c.rotation.y = clock.elapsedTime * 0.3 + i;
    });
  });
  if (phase !== "orbit" || mode !== "eva") return null;
  return (
    <group ref={g}>
      {PODS.map((p) => (
        <group key={p.id} position={p.at}>
          <mesh material={materials.gold}>
            <boxGeometry args={[1, 1, 1]} />
          </mesh>
          <mesh material={podGlow} position={[0.51, 0, 0]}>
            <boxGeometry args={[0.02, 0.7, 0.7]} />
          </mesh>
          <Html center distanceFactor={14} position={[0, 1.2, 0]} className={`pod-label${open === p.id ? " open" : ""}`}>
            {p.name}
          </Html>
        </group>
      ))}
    </group>
  );
}

/**
 * The visitor, as an astronaut in a suit: walked on the pad and on Mars,
 * flown on a jetpack outside the ship, followed by the camera, and steered
 * through the flight by mission control's objectives.
 */
export function Astronaut() {
  const model = useRef<AstronautHandle>(null);
  const holder = useRef<Group>(null);
  const seen = useRef(-1);
  const phase = useStore((s) => s.phase);
  const mode = useStore((s) => s.transitMode);

  // Where the astronaut is when each part of the flight begins.
  useEffect(() => {
    if (phase === "pad") {
      if (!progress.briefRead) setAstroMode("walk", PAD_SPAWN, Math.atan2(PAD_SPAWN.z - BOARD_AT.z, BOARD_AT.x - PAD_SPAWN.x));
      else setAstroMode("walk", LIFT_AT.clone().setX(LIFT_AT.x + 3), Math.PI);
    } else if (phase === "orbit") {
      if (!progress.backInside) setAstroMode("eva", HATCH_AT.clone().setY(HATCH_AT.y + 0.6), Math.PI / 2);
      else setAstroMode("aboard");
    } else if ((phase === "transit" || phase === "marsOrbit") && mode === "holding") {
      setAstroMode("eva", HATCH_AT.clone().setY(HATCH_AT.y + 0.6), 0);
    } else if (phase === "surface") {
      const t = surfaceWorld.terrain;
      const y = GROUND_Y + (t ? t.height(MARS_SPAWN.x, MARS_SPAWN.z) : 0);
      progress.inRover = false;
      setAstroMode("walk", new Vector3(MARS_SPAWN.x, y + 0.5, MARS_SPAWN.z), Math.PI / 4);
    } else {
      setAstroMode("aboard");
    }
  }, [phase, mode]);

  useFrame(({ camera, controls, clock }, delta) => {
    const dt = Math.min(delta, 0.1);
    const p = useStore.getState().phase;
    updateGuide(labels);
    const c = controls as OrbitControlsImpl | null;
    const h = holder.current;
    const visible = astro.mode !== "aboard";
    if (h) h.visible = visible;
    if (!visible) {
      if (seen.current !== astro.revision) {
        seen.current = astro.revision;
        resetFollow();
        // Back inside the ship: hand the view back to the ship's own camera.
        if (c && (p === "orbit" || p === "transit" || p === "marsOrbit")) {
          c.target.set(0, 0, 0);
          camera.position.set(-12, 7, 26);
          c.update();
        }
      }
      return;
    }

    let firing = false;
    const s = astro.scripted;
    const target = c ? c.target : focus.set(0, 0, 0);
    if (s) {
      const k = Math.min((Date.now() - s.startMs) / s.durationMs, 1);
      astro.pos.lerpVectors(s.from, s.to, k);
      astro.stride = (astro.stride + dt / 1.2) % 1;
      if (Math.abs(s.to.x - s.from.x) + Math.abs(s.to.z - s.from.z) > 0.1) astro.yaw = Math.atan2(-(s.to.z - s.from.z), s.to.x - s.from.x);
      if (k >= 1) {
        const done = s.done;
        astro.scripted = null;
        done();
      }
    } else if (astro.mode === "walk") {
      walk(p, camera, target, dt);
    } else {
      firing = eva(camera, target, dt);
    }

    if (h) {
      h.position.copy(astro.pos);
      h.rotation.set(0, astro.yaw, 0);
    }
    const pace = s ? 1 : Math.hypot(astro.vel.x, astro.vel.z) / WALK_SPEED;
    model.current?.pose(astro.stride, pace, astro.mode === "eva", firing, clock.elapsedTime);

    focus.copy(astro.pos).y += SUIT_HEIGHT * 0.7;
    start.set(-Math.cos(astro.yaw) * 7, 3, Math.sin(astro.yaw) * 7);
    if (seen.current !== astro.revision) {
      seen.current = astro.revision;
      resetFollow();
    }
    followTarget(camera, c, focus, `astro:${astro.revision}`, start);
  });

  return (
    <>
      <group ref={holder} visible={false}>
        <AstronautModel ref={model} />
      </group>
      <Marker />
      <PadProps />
      <Pods />
    </>
  );
}
