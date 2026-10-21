"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useStore } from "@/state/store";
import { materials } from "../craft/materials";
import { sky } from "../skyRuntime";
import { endHold, holdProgress, rescue, rescueNeeded, startHold } from "./rescue";

const AT: [number, number, number] = [26, 6, -34];

/** The drifting drone for F09, tumbling until the correction burn lands. */
export function RescueDrone() {
  const group = useRef<Group>(null);
  const plume = useRef<Group>(null);
  const reduced = useReducedMotion();

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const phase = useStore.getState().phase;
    const show = (phase === "orbit" || phase === "transit") && (rescueNeeded(sky.simMs) || rescue.done);
    g.visible = show;
    if (!show) return;
    const p = holdProgress();
    if (p >= 1 && !rescue.done) endHold();
    if (!rescue.done && !reduced) {
      // Tumbling: a slow spin about a tilted axis, as an uncontrolled body keeps doing.
      g.rotation.x += delta * 0.7;
      g.rotation.z += delta * 0.45;
    } else if (rescue.done) {
      // Stabilised: ease back to level.
      g.rotation.x *= 1 - Math.min(delta * 2, 1);
      g.rotation.z *= 1 - Math.min(delta * 2, 1);
    }
    if (plume.current) plume.current.visible = rescue.holdingSince > 0;
  });

  return (
    <group
      ref={group}
      position={AT}
      visible={false}
      onPointerDown={(e) => {
        e.stopPropagation();
        startHold();
      }}
      onPointerUp={() => endHold()}
      onPointerOut={() => endHold()}
    >
      <mesh material={materials.gold}>
        <boxGeometry args={[1.6, 1.2, 1.2]} />
      </mesh>
      <mesh material={materials.cells} position={[0, 0, 1.8]}>
        <boxGeometry args={[0.9, 0.04, 2.2]} />
      </mesh>
      <mesh material={materials.cells} position={[0, 0, -1.8]}>
        <boxGeometry args={[0.9, 0.04, 2.2]} />
      </mesh>
      <group ref={plume} visible={false} position={[-1.1, 0, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[0.25, 1.2, 12]} />
          <meshBasicMaterial color="#cfe6ff" transparent opacity={0.6} />
        </mesh>
      </group>
    </group>
  );
}
