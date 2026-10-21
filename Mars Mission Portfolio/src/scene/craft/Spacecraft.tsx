"use client";

import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { type Group, LatheGeometry, Vector2 } from "three";
import { materials } from "./materials";

/**
 * Crew spacecraft in metres, local +y along the nose. The origin is the
 * joint between service module and capsule, which is the scene's local
 * origin for the whole mission.
 *
 * Proportions follow a current crewed capsule: a 5 m wide service module
 * wrapped in gold thermal blanket, four solar wings in an X, and a conical
 * crew module on top.
 */
export const SM_HEIGHT = 4;
export const SC_RADIUS = 2.5;
const CAPSULE_HEIGHT = 3.3;
const WING_LENGTH = 7;
const PANEL = 2;

export type SpacecraftHandle = {
  /** 0 folded against the hull, 1 fully deployed. */
  setDeploy(f: number): void;
};

function bellGeometry(throat: number, exit: number, length: number) {
  const pts: Vector2[] = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    // Parabolic bell: radius grows fast near the throat, then flattens.
    pts.push(new Vector2(throat + (exit - throat) * Math.sqrt(t), -t * length));
  }
  return new LatheGeometry(pts, 32);
}

function Wing({ angle, wingRef }: { angle: number; wingRef: (g: Group | null) => void }) {
  return (
    <group rotation={[0, angle, 0]} position={[0, -SM_HEIGHT / 2, 0]}>
      <group position={[SC_RADIUS, 0, 0]} ref={wingRef}>
        {/* Boom from the hull to the first panel. */}
        <mesh material={materials.frame} position={[0.4, 0, 0]}>
          <boxGeometry args={[0.8, 0.12, 0.12]} />
        </mesh>
        {Array.from({ length: 3 }, (_, i) => (
          <mesh key={i} material={materials.cells} position={[0.8 + PANEL * i + PANEL / 2, 0, 0]}>
            <boxGeometry args={[PANEL - 0.06, 0.04, PANEL]} />
          </mesh>
        ))}
        <mesh material={materials.frame} position={[0.8 + (WING_LENGTH - 0.8) / 2, 0, 0]}>
          <boxGeometry args={[WING_LENGTH - 0.8, 0.06, 0.06]} />
        </mesh>
      </group>
    </group>
  );
}

export const Spacecraft = forwardRef<SpacecraftHandle>(function Spacecraft(_, ref) {
  const wings = useRef<(Group | null)[]>([]);
  const nozzle = useMemo(() => bellGeometry(0.25, 0.9, 1.6), []);

  useImperativeHandle(ref, () => ({
    setDeploy(f: number) {
      for (const w of wings.current) {
        if (!w) continue;
        // Folded wings lie flat against the hull, then swing out and unfold.
        w.rotation.z = (1 - f) * (Math.PI / 2 - 0.05);
        w.scale.x = 0.12 + 0.88 * f;
      }
    },
  }));

  return (
    <group>
      {/* Service module. */}
      <mesh material={materials.gold} position={[0, -SM_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[SC_RADIUS, SC_RADIUS, SM_HEIGHT, 48]} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={i}
          material={materials.radiator}
          position={[Math.cos((i * Math.PI) / 2) * 2.52, -SM_HEIGHT / 2, Math.sin((i * Math.PI) / 2) * 2.52]}
          rotation={[0, -(i * Math.PI) / 2, 0]}
        >
          <boxGeometry args={[0.02, SM_HEIGHT * 0.8, 1.4]} />
        </mesh>
      ))}
      <mesh geometry={nozzle} material={materials.nozzle} position={[0, -SM_HEIGHT, 0]} />
      {[Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4].map((a, i) => (
        <Wing
          key={a}
          angle={a}
          wingRef={(g) => {
            wings.current[i] = g;
          }}
        />
      ))}
      {/* Heat shield and crew module. */}
      <mesh material={materials.heatShield} position={[0, 0.1, 0]}>
        <cylinderGeometry args={[SC_RADIUS, SC_RADIUS, 0.2, 48]} />
      </mesh>
      <mesh material={materials.capsule} position={[0, 0.2 + CAPSULE_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[1.0, SC_RADIUS, CAPSULE_HEIGHT, 48]} />
      </mesh>
      <mesh material={materials.frame} position={[0, 0.2 + CAPSULE_HEIGHT + 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.7, 0.08, 12, 32]} />
      </mesh>
      {/* RCS thruster pods on the capsule shoulder. */}
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={i}
          material={materials.black}
          position={[Math.cos((i * Math.PI) / 2 + 0.3) * 2.05, 1.2, Math.sin((i * Math.PI) / 2 + 0.3) * 2.05]}
        >
          <boxGeometry args={[0.18, 0.18, 0.18]} />
        </mesh>
      ))}
    </group>
  );
});

export const CAPSULE_TOP = 0.2 + CAPSULE_HEIGHT;
