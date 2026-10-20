"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { PlaneGeometry, Vector3 } from "three";
import { wrecks } from "@/content/wrecks";
import { beamRuntime } from "./beamState";
import { seaRuntime } from "./seaRuntime";
import { painted, SHIP_LENGTH, shipGeometry } from "./ships/models";
import { wreckMaterial } from "./ships/shipMaterial";
import { shipState } from "./ships/shipRuntime";

const SEABED_Y = -16;
// Steeper than this (tilt below it) and the water turns clear.
const CLEAR_FROM_TILT = 0.52;
const CLEAR_FULL_TILT = 0.4;
const LINGER_S = 2;

// The steepest beam reaches the seabed about 31 m out, so wrecks lie a
// little beyond that, on the side the camera can see past the tower.
const SPOTS = [
  { yaw: -0.3, dist: 36, heading: 1.1, roll: 0.55, pitch: 0.12 },
  { yaw: 0.2, dist: 40, heading: -0.6, roll: -0.7, pitch: -0.1 },
  { yaw: -0.8, dist: 34, heading: 2.4, roll: 0.4, pitch: 0.2 },
];

const hit = new Vector3();
const spot = new Vector3();

/** F17: abandoned projects on the seabed, seen when the beam is tilted down into clear water. */
export function Wrecks() {
  const lastSeen = useRef<number[]>(wrecks.map(() => -Infinity));
  const seabed = useMemo(() => {
    const g = new PlaneGeometry(160, 160);
    g.rotateX(-Math.PI / 2);
    g.translate(0, SEABED_Y, 0);
    return painted(g, "#4a4636");
  }, []);

  const placed = useMemo(
    () =>
      wrecks.map((w, i) => {
        const s = SPOTS[i % SPOTS.length]!;
        return { ...s, x: -Math.sin(s.yaw) * s.dist, z: -Math.cos(s.yaw) * s.dist, wreck: w };
      }),
    [],
  );

  useFrame(({ clock }, delta) => {
    // Where the beam reaches the seabed. The clear window opens over that spot.
    const down = Math.max(-beamRuntime.dir.y, 0.001);
    hit.copy(beamRuntime.dir).multiplyScalar((beamRuntime.origin.y - SEABED_Y) / down).add(beamRuntime.origin);
    seaRuntime.clearCenter.value.copy(hit);

    const steep = Math.min(1, Math.max(0, (CLEAR_FROM_TILT - beamRuntime.tilt) / (CLEAR_FROM_TILT - CLEAR_FULL_TILT)));
    const target = steep * beamRuntime.intensity.value;
    seaRuntime.clarity.value += (target - seaRuntime.clarity.value) * Math.min(1, delta * 3);

    const t = clock.elapsedTime;
    placed.forEach((p, i) => {
      const state = shipState(p.wreck.id);
      state.length = SHIP_LENGTH[p.wreck.hull];
      state.anchor.set(p.x, SEABED_Y + 4, p.z);
      state.aimY = SEABED_Y;
      spot.set(p.x, SEABED_Y, p.z);
      const seen = seaRuntime.clarity.value > 0.5 && spot.distanceTo(hit) < seaRuntime.clearRadius.value;
      if (seen) lastSeen.current[i] = t;
      const want = t - lastSeen.current[i]! < LINGER_S ? 1 : 0;
      state.reveal += (want - state.reveal) * Math.min(1, delta * (want ? 4 : 1));
    });
  });

  return (
    <group>
      <mesh geometry={seabed} material={wreckMaterial()} />
      {placed.map((p) => (
        <mesh
          key={p.wreck.id}
          geometry={shipGeometry(p.wreck.hull)}
          material={wreckMaterial()}
          position={[p.x, SEABED_Y + 0.6, p.z]}
          rotation={[p.pitch, p.heading, p.roll, "YXZ"]}
        />
      ))}
    </group>
  );
}
