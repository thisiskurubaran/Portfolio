"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, ConeGeometry, DoubleSide, Group, ShaderMaterial } from "three";
import vertexShader from "@/shaders/beam.vert";
import fragmentShader from "@/shaders/beam.frag";
import { BEAM, beamRuntime, tiltToPitch } from "./beamState";

export function Beam() {
  const group = useRef<Group>(null);

  const geometry = useMemo(() => {
    const radius = Math.tan(BEAM.halfAngle) * BEAM.length;
    const g = new ConeGeometry(radius, BEAM.length, 24, 1, true);
    // Apex at the origin, opening along -Z, so group rotation is yaw then pitch.
    g.translate(0, -BEAM.length / 2, 0);
    g.rotateX(Math.PI / 2);
    return g;
  }, []);

  // Constructed directly so the shared intensity and hit values stay linked;
  // R3F's uniforms prop would copy them.
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uColor: { value: BEAM.color },
          uIntensity: beamRuntime.intensity,
          uHitAlong: beamRuntime.hitAlong,
        },
        transparent: true,
        depthWrite: false,
        side: DoubleSide,
        blending: AdditiveBlending,
      }),
    [],
  );

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    g.position.copy(beamRuntime.origin);
    g.rotation.set(tiltToPitch(beamRuntime.tilt), beamRuntime.yaw, 0, "YXZ");
  });

  return (
    <group ref={group}>
      <mesh geometry={geometry} material={material} frustumCulled={false} renderOrder={10} />
    </group>
  );
}
