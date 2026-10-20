"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, Vector3 } from "three";
import { entries } from "@/content";
import type { VesselEntry } from "@/content/types";
import { isInBeam } from "../beamState";
import { envRuntime } from "../envRuntime";
import { isHarborMode, useSceneStore } from "@/state/store";
import { waveHeight } from "../seaRuntime";
import { driftFor, poseAt, type Pose } from "./drift";
import { SHIP_HEIGHT, SHIP_LENGTH, shipGeometry } from "./models";
import { shipState } from "./shipRuntime";

import { shipMaterial } from "./shipMaterial";

const LINGER_SECONDS = 2.5;
const toShip = new Vector3();

function Ship({ entry, index }: { entry: VesselEntry; index: number }) {
  const group = useRef<Group>(null);
  const drift = useMemo(() => driftFor(entry, index, entries.length - 1), [entry, index]);
  const geometry = shipGeometry(entry.kind);
  const pose = useRef<Pose>({ x: 0, z: 0, heading: 0 });
  // Small hulls toss about, big ones barely notice.
  const tossScale = Math.min(1.4, 6 / SHIP_LENGTH[entry.kind]);
  const lastSeen = useRef(-Infinity);

  useFrame(({ clock }, delta) => {
    const g = group.current;
    if (!g) return;
    const p = poseAt(drift, clock.elapsedTime, pose.current);

    // Sample the water around the hull to get height and slope.
    const half = SHIP_LENGTH[entry.kind] / 2;
    const fx = -Math.sin(p.heading);
    const fz = -Math.cos(p.heading);
    const bow = waveHeight(p.x + fx * half, p.z + fz * half);
    const stern = waveHeight(p.x - fx * half, p.z - fz * half);
    const port = waveHeight(p.x - fz, p.z + fx);
    const starboard = waveHeight(p.x + fz, p.z - fx);

    // Storms throw hulls about more than the wave slope alone would.
    const storm = 1 + envRuntime.storm.value * 1.2;
    const pitch = Math.atan2(bow - stern, half * 2) * tossScale * storm;
    const roll = Math.atan2(port - starboard, 2) * tossScale * 0.6 * storm;
    const ease = 1 - Math.exp(-4 * delta);

    g.position.set(p.x, g.position.y + ((bow + stern) / 2 - g.position.y) * ease, p.z);
    g.rotation.set(
      g.rotation.x + (pitch - g.rotation.x) * ease,
      p.heading,
      g.rotation.z + (roll - g.rotation.z) * ease,
      "YXZ",
    );

    const state = shipState(entry.id);
    state.length = SHIP_LENGTH[entry.kind];
    state.anchor.set(p.x, g.position.y + SHIP_HEIGHT[entry.kind] + 1, p.z);
    toShip.set(p.x, g.position.y + 1, p.z);
    const t = clock.elapsedTime;
    // In harbor mode every ship is readable in daylight, beam or not.
    if (isInBeam(toShip) || isHarborMode(useSceneStore.getState())) lastSeen.current = t;
    const target = t - lastSeen.current < LINGER_SECONDS ? 1 : 0;
    // Fade in quickly when found, out slowly once the beam moves on.
    const rate = target > state.reveal ? 4 : 0.8;
    state.reveal += (target - state.reveal) * Math.min(1, rate * delta);
  });

  const open = () => {
    if (shipState(entry.id).reveal > 0.3) useSceneStore.getState().select(entry.id);
  };

  return (
    <group ref={group}>
      <mesh
        geometry={geometry}
        material={shipMaterial()}
        onClick={(e) => {
          e.stopPropagation();
          open();
        }}
        onPointerOver={() => {
          if (shipState(entry.id).reveal > 0.3) document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "";
        }}
      />
    </group>
  );
}

export function Ships() {
  return (
    <group>
      {entries.map((entry, i) => (
        <Ship key={entry.id} entry={entry} index={i} />
      ))}
    </group>
  );
}
