"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { DoubleSide, type Group, MeshStandardMaterial, Vector3 } from "three";
import { stations, type StationModel } from "@/content/stations";
import { stops } from "@/content/stops";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useStore } from "@/state/store";
import { CAPSULE_TOP } from "../craft/Spacecraft";
import { materials } from "../craft/materials";
import { local } from "../localRuntime";
import { APPROACH_S, DOCKING_S, UNDOCKING_S } from "../PhaseDriver";
import { currentVisits } from "../visits";

/** Where the ship's docking ring sits on the local x axis (nose forward). */
export const SHIP_PORT_X = CAPSULE_TOP + 0.1;
const MODULE_LENGTH = 8;
const MODULE_RADIUS = 2.1;
const RING_RADIUS = 12;
/**
 * Spin for the habitat ring: omega = sqrt(g / r). At 12 m radius, Mars
 * gravity (3.72 m/s^2) needs about 0.56 rad/s, a little over 5 rpm, so the
 * crew can get used to Mars before arriving.
 */
const RING_SPIN = Math.sqrt(3.72 / RING_RADIUS);
export const HOLD_M = 40;
const START_M = 600;

function ease(t: number): number {
  const x = Math.min(Math.max(t, 0), 1);
  return 1 - Math.pow(1 - x, 3);
}

function easeInOut(t: number): number {
  const x = Math.min(Math.max(t, 0), 1);
  return x * x * (3 - 2 * x);
}

/** Gap between the docking ports, metres, for the current docking move. */
function portGap(): number {
  const { transitMode, modeSince } = useStore.getState();
  const s = (Date.now() - modeSince) / 1000;
  switch (transitMode) {
    case "approach":
      return START_M + (HOLD_M - START_M) * ease(s / APPROACH_S);
    case "holding":
      return HOLD_M;
    case "docking":
      return HOLD_M * (1 - easeInOut(s / DOCKING_S));
    case "docked":
      return 0;
    case "undocking":
      return 300 * Math.pow(Math.min(s / UNDOCKING_S, 1), 2);
    default:
      return -1;
  }
}

function Model({ model }: { model: StationModel }) {
  const arrays = useRef<Group>(null);
  const ring = useRef<Group>(null);
  const reduced = useReducedMotion();
  const accent = useMemo(
    () => new MeshStandardMaterial({ color: model.accent, roughness: 0.5, emissive: model.accent, emissiveIntensity: 0.15 }),
    [model.accent],
  );
  const length = 6.4 + model.modules * MODULE_LENGTH;
  const trussX = 6.4 + (model.modules * MODULE_LENGTH) / 2;

  useFrame((_, delta) => {
    // Wings turn on the truss axis to face the Sun, as real arrays track it.
    if (arrays.current) arrays.current.rotation.z = Math.atan2(local.sunDir.x, local.sunDir.y);
    if (ring.current && !reduced) ring.current.rotation.x += RING_SPIN * delta;
  });

  return (
    <group>
      {/* Docking adapter and node; the port faces the ship along -x. */}
      <mesh material={materials.frame} position={[1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.9, 1.1, 2, 24]} />
      </mesh>
      <mesh material={materials.capsule} position={[4, 0, 0]}>
        <sphereGeometry args={[2.4, 32, 16]} />
      </mesh>
      {Array.from({ length: model.modules }, (_, i) => (
        <group key={i} position={[6.4 + i * MODULE_LENGTH + MODULE_LENGTH / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <mesh material={i % 2 === 0 ? materials.radiator : materials.capsule}>
            <cylinderGeometry args={[MODULE_RADIUS, MODULE_RADIUS, MODULE_LENGTH - 0.2, 32]} />
          </mesh>
          <mesh material={accent} position={[0, MODULE_LENGTH / 2 - 0.6, 0]}>
            <cylinderGeometry args={[MODULE_RADIUS + 0.04, MODULE_RADIUS + 0.04, 0.5, 32]} />
          </mesh>
        </group>
      ))}
      {/* Truss across the station with solar wings in pairs. */}
      <group position={[trussX, 0, 0]}>
        <mesh material={materials.frame}>
          <boxGeometry args={[0.8, 0.8, 8 + model.arrays * 26]} />
        </mesh>
        <group ref={arrays}>
          {Array.from({ length: model.arrays }, (_, i) =>
            [-1, 1].map((side) => (
              <mesh
                key={`${i}${side}`}
                material={materials.cells}
                position={[0, 0, side * (6 + i * 13 + 6)]}
              >
                <boxGeometry args={[4, 0.06, 12]} />
              </mesh>
            )),
          )}
        </group>
      </group>
      {/* Radiators, edge on to the Sun. */}
      {[-1, 1].map((side) => (
        <mesh key={side} material={materials.radiator} position={[4, side * 5, 0]}>
          <boxGeometry args={[3, 6, 0.08]} />
        </mesh>
      ))}
      {model.ring && (
        <group ref={ring} position={[length - 4, 0, 0]}>
          <mesh material={materials.capsule} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[RING_RADIUS, 1.3, 16, 64]} />
          </mesh>
          {[0, 1, 2, 3].map((k) => (
            <mesh key={k} material={materials.frame} rotation={[(k * Math.PI) / 2, 0, 0]}>
              <boxGeometry args={[0.6, RING_RADIUS * 2, 0.6]} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

const sunshieldLayer = new MeshStandardMaterial({
  color: "#b9a6c9",
  roughness: 0.25,
  metalness: 0.8,
  side: DoubleSide,
});
const worldPos = new Vector3();
const mirrorGold = new MeshStandardMaterial({ color: "#e0b04a", roughness: 0.12, metalness: 1 });

/**
 * A deep space observatory: a five layer sunshield the size of a tennis
 * court keeps the mirror and instruments in permanent shade, cold enough
 * to see in the infrared.
 */
function Observatory() {
  const shield = useRef<Group>(null);

  useFrame(() => {
    // Shield faces the Sun, mirror side away from it.
    const sh = shield.current;
    if (sh) sh.lookAt(sh.getWorldPosition(worldPos).sub(local.sunDir));
  });

  return (
    <group position={[14, 0, 0]}>
      <group ref={shield}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} material={sunshieldLayer} position={[0, 0, -i * 0.35]} rotation={[0, 0, Math.PI / 4]}>
            <planeGeometry args={[16 - i * 0.6, 11 - i * 0.4]} />
          </mesh>
        ))}
        {/* Primary mirror of hexagonal segments, on the shaded side. */}
        <group position={[0, 0, 3.2]}>
          {[
            [0, 0],
            [1.3, 0.75],
            [-1.3, 0.75],
            [1.3, -0.75],
            [-1.3, -0.75],
            [0, 1.5],
            [0, -1.5],
          ].map(([x, y]) => (
            <mesh key={`${x}${y}`} material={mirrorGold} position={[x!, y!, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.72, 0.72, 0.1, 6]} />
            </mesh>
          ))}
          <mesh material={materials.frame} position={[0, 0, 2.2]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 4.4, 8]} />
          </mesh>
        </group>
        <mesh material={materials.gold} position={[0, 0, 1.5]}>
          <boxGeometry args={[2.4, 2.4, 1.6]} />
        </mesh>
      </group>
    </group>
  );
}

/** The station or stop object being visited, placed ahead of the ship's nose along the docking axis. */
export function Station() {
  const group = useRef<Group>(null);
  const phase = useStore((s) => s.phase);
  const index = useStore((s) => s.visitIndex);
  // Visit lists are fixed before this component sees the phase that uses them.
  const visit = phase === "transit" || phase === "marsOrbit" ? currentVisits()[index] : undefined;
  const model =
    visit?.kind === "station"
      ? stations[visit.station]?.model
      : visit?.kind === "stop"
        ? stops.find((s) => s.id === visit.stop)?.model
        : undefined;

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const gap = portGap();
    g.visible = gap >= 0;
    g.position.set(SHIP_PORT_X + Math.max(gap, 0), 0, 0);
  });

  if (!visit || !model) return null;
  return (
    <group ref={group} visible={false}>
      {"kind" in model && model.kind === "observatory" ? <Observatory /> : <Model key={visit.id} model={model} />}
    </group>
  );
}
