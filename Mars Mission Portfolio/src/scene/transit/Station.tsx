"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { type Group, MeshStandardMaterial } from "three";
import { stations, type StationModel } from "@/content/stations";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useStore } from "@/state/store";
import { CAPSULE_TOP } from "../craft/Spacecraft";
import { materials } from "../craft/materials";
import { local } from "../localRuntime";
import { APPROACH_S, DOCKING_S, UNDOCKING_S } from "../PhaseDriver";

/** Where the ship's docking ring sits on the local x axis (nose forward). */
const SHIP_PORT_X = CAPSULE_TOP + 0.1;
const MODULE_LENGTH = 8;
const MODULE_RADIUS = 2.1;
const RING_RADIUS = 12;
/**
 * Spin for the habitat ring: omega = sqrt(g / r). At 12 m radius, Mars
 * gravity (3.72 m/s^2) needs about 0.56 rad/s, a little over 5 rpm, so the
 * crew can get used to Mars before arriving.
 */
const RING_SPIN = Math.sqrt(3.72 / RING_RADIUS);
const HOLD_M = 40;
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

/** The station being visited, placed ahead of the ship's nose along the docking axis. */
export function Station() {
  const group = useRef<Group>(null);
  const phase = useStore((s) => s.phase);
  const index = useStore((s) => s.stationIndex);
  const station = stations[index];

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const gap = portGap();
    g.visible = gap >= 0;
    g.position.set(SHIP_PORT_X + Math.max(gap, 0), 0, 0);
  });

  if (phase !== "transit" || !station) return null;
  return (
    <group ref={group} visible={false}>
      <Model key={station.id} model={station.model} />
    </group>
  );
}
