"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { type Group, MeshStandardMaterial } from "three";

// Suit fabric is an off-white Ortho-Fabric weave; the visor is gold coated
// against glare, as on real EVA helmets.
const suit = new MeshStandardMaterial({ color: "#e9e7e1", roughness: 0.85 });
const joint = new MeshStandardMaterial({ color: "#bdbab2", roughness: 0.9 });
const visor = new MeshStandardMaterial({ color: "#c9952e", roughness: 0.15, metalness: 1 });
const pack = new MeshStandardMaterial({ color: "#d9d6cf", roughness: 0.7 });
const flag = new MeshStandardMaterial({ color: "#ff9933", roughness: 0.8 });
const boot = new MeshStandardMaterial({ color: "#6c6a66", roughness: 0.9 });
const jet = new MeshStandardMaterial({ color: "#dfeaff", emissive: "#dfeaff", emissiveIntensity: 3, transparent: true, opacity: 0.7 });

export type AstronautHandle = {
  /** Poses the body: stride 0..1 through a step, how fast it walks (0 stands), and whether it floats. */
  pose: (stride: number, pace: number, floating: boolean, thrusting: boolean, t: number) => void;
  root: Group | null;
};

/** Built facing +x, feet at y = 0, about 1.9 m tall in the suit. */
export const AstronautModel = forwardRef<AstronautHandle>(function AstronautModel(_, ref) {
  const root = useRef<Group>(null);
  const legL = useRef<Group>(null);
  const legR = useRef<Group>(null);
  const armL = useRef<Group>(null);
  const armR = useRef<Group>(null);
  const body = useRef<Group>(null);
  const jets = useRef<Group>(null);

  useImperativeHandle(ref, () => ({
    get root() {
      return root.current;
    },
    pose(stride, pace, floating, thrusting, t) {
      const swing = Math.sin(stride * Math.PI * 2) * 0.55 * Math.min(pace, 1);
      if (floating) {
        // Arms and legs drift a little apart, as a body relaxes in free fall.
        const drift = Math.sin(t * 0.8) * 0.08;
        legL.current?.rotation.set(0.12 + drift, 0, 0.18);
        legR.current?.rotation.set(-0.08 - drift, 0, -0.18);
        armL.current?.rotation.set(0.3, 0, 0.5 + drift);
        armR.current?.rotation.set(-0.3, 0, -0.5 - drift);
        body.current?.position.set(0, 0, 0);
      } else {
        legL.current?.rotation.set(0, 0, swing);
        legR.current?.rotation.set(0, 0, -swing);
        armL.current?.rotation.set(0.12, 0, -swing * 0.7);
        armR.current?.rotation.set(-0.12, 0, swing * 0.7);
        // The body bobs twice per stride, once per footfall.
        body.current?.position.set(0, Math.abs(Math.cos(stride * Math.PI * 2)) * 0.04 * Math.min(pace, 1), 0);
      }
      if (jets.current) jets.current.visible = thrusting;
    },
  }));

  return (
    <group ref={root}>
      <group ref={body}>
        {/* Torso and the hard upper torso shell. */}
        <mesh material={suit} position={[0, 1.22, 0]}>
          <capsuleGeometry args={[0.25, 0.42, 6, 14]} />
        </mesh>
        <mesh material={pack} position={[-0.33, 1.25, 0]}>
          <boxGeometry args={[0.3, 0.65, 0.5]} />
        </mesh>
        {/* Chest control module, and a flag patch on the shoulder. */}
        <mesh material={joint} position={[0.24, 1.25, 0]}>
          <boxGeometry args={[0.1, 0.16, 0.3]} />
        </mesh>
        <mesh material={flag} position={[0, 1.42, 0.27]}>
          <boxGeometry args={[0.12, 0.08, 0.01]} />
        </mesh>
        {/* Helmet with the gold visor down. */}
        <mesh material={suit} position={[0, 1.7, 0]}>
          <sphereGeometry args={[0.2, 24, 16]} />
        </mesh>
        <mesh material={visor} position={[0.06, 1.7, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <sphereGeometry args={[0.175, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2.2]} />
        </mesh>
        <group ref={armL} position={[0, 1.42, 0.32]}>
          <mesh material={suit} position={[0, -0.27, 0]}>
            <capsuleGeometry args={[0.08, 0.4, 4, 10]} />
          </mesh>
          <mesh material={joint} position={[0, -0.58, 0]}>
            <sphereGeometry args={[0.075, 10, 8]} />
          </mesh>
        </group>
        <group ref={armR} position={[0, 1.42, -0.32]}>
          <mesh material={suit} position={[0, -0.27, 0]}>
            <capsuleGeometry args={[0.08, 0.4, 4, 10]} />
          </mesh>
          <mesh material={joint} position={[0, -0.58, 0]}>
            <sphereGeometry args={[0.075, 10, 8]} />
          </mesh>
        </group>
        <group ref={legL} position={[0, 0.88, 0.12]}>
          <mesh material={suit} position={[0, -0.4, 0]}>
            <capsuleGeometry args={[0.1, 0.6, 4, 10]} />
          </mesh>
          <mesh material={boot} position={[0.05, -0.82, 0]}>
            <boxGeometry args={[0.28, 0.12, 0.16]} />
          </mesh>
        </group>
        <group ref={legR} position={[0, 0.88, -0.12]}>
          <mesh material={suit} position={[0, -0.4, 0]}>
            <capsuleGeometry args={[0.1, 0.6, 4, 10]} />
          </mesh>
          <mesh material={boot} position={[0.05, -0.82, 0]}>
            <boxGeometry args={[0.28, 0.12, 0.16]} />
          </mesh>
        </group>
        {/* Jetpack thruster puffs, shown while firing. */}
        <group ref={jets} visible={false}>
          {[0.2, -0.2].map((z) => (
            <mesh key={z} material={jet} position={[-0.55, 1.0, z]} rotation={[0, 0, Math.PI / 2]}>
              <coneGeometry args={[0.05, 0.3, 8]} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
});
