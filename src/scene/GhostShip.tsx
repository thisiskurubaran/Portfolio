"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, Group, MeshBasicMaterial } from "three";
import { ghostShip } from "@/content/ghost";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useSceneStore } from "@/state/store";
import { waveHeight } from "./seaRuntime";
import { SHIP_HEIGHT, SHIP_LENGTH, shipGeometry } from "./ships/models";
import { shipState } from "./ships/shipRuntime";

const DISTANCE = 90;
const ARC = 1.2;
const CROSSING_S = 150;
const PAUSE_S = 60;
// Larger than life so it reads at this distance, the way a ghost story tells it.
const SCALE = 2.2;

// Glows faintly through fog and needs no beam: it is not quite there.
const ghostMaterial = new MeshBasicMaterial({
  color: "#bfe6d8",
  transparent: true,
  opacity: 0.45,
  blending: AdditiveBlending,
  depthWrite: false,
  fog: false,
});

/** F26: after midnight a faint ghost ship drifts across the horizon. */
export function GhostShip() {
  const group = useRef<Group>(null);
  const start = useRef<number | null>(null);
  const reducedMotion = useReducedMotion();

  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    const active = useSceneStore.getState().ghostHour;
    const state = shipState(ghostShip.id);
    if (!active) {
      g.visible = false;
      state.reveal = 0;
      start.current = null;
      return;
    }

    const t = clock.elapsedTime;
    start.current ??= t;
    const cycle = (t - start.current) % (CROSSING_S + PAUSE_S);
    const along = cycle / CROSSING_S;
    const sailing = along <= 1;
    g.visible = sailing;

    // Left to right across the seaward arc.
    const yaw = ARC - 2 * ARC * Math.min(1, along);
    const x = -Math.sin(yaw) * DISTANCE;
    const z = -Math.cos(yaw) * DISTANCE;
    g.position.set(x, waveHeight(x, z) * 0.5 + 0.3, z);
    g.rotation.set(0, yaw - Math.PI / 2, Math.sin(t * 0.6) * 0.04);
    ghostMaterial.opacity = reducedMotion ? 0.45 : 0.4 + 0.1 * Math.sin(t * 0.8);

    state.length = SHIP_LENGTH.sailboat * SCALE;
    state.anchor.set(x, g.position.y + SHIP_HEIGHT.sailboat * SCALE + 1, z);
    // Fades in and out at the ends of its crossing.
    state.reveal = sailing ? Math.min(1, along * 8, (1 - along) * 8) : 0;
  });

  return (
    <group ref={group} visible={false} scale={SCALE}>
      <mesh geometry={shipGeometry("sailboat")} material={ghostMaterial} />
    </group>
  );
}
