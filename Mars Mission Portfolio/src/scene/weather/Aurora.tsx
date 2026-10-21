"use client";

import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, ShaderMaterial, Vector3 } from "three";
import vert from "@/shaders/aurora.vert";
import frag from "@/shaders/aurora.frag";
import { activeShowers } from "@/space/meteors";
import { auroraEdgeDeg } from "@/space/spaceWeather";
import { effective, useConditions } from "@/state/conditions";
import { sky } from "../skyRuntime";

/** Aurora shell height: 110 km, as a fraction of Earth's radius. */
const SHELL = 1 + 110 / 6371;
const toRad = Math.PI / 180;
// North geomagnetic pole, IGRF 2025: about 80.8 N, 72.7 W. Mesh convention:
// north on +y, longitude 0 on +x, 90 E on -z.
const POLE_LAT = 80.8 * toRad;
const POLE_LON = -72.7 * toRad;

const uniforms = {
  uMagPole: {
    value: new Vector3(
      Math.cos(POLE_LAT) * Math.cos(POLE_LON),
      Math.sin(POLE_LAT),
      -Math.cos(POLE_LAT) * Math.sin(POLE_LON),
    ),
  },
  uEdgeDeg: { value: 66 },
  uStrength: { value: 0 },
  uSunDir: { value: sky.sunDir },
  uTime: { value: 0 },
};

/** F03: aurora on Earth from the live Kp index, or a storm staged on the console. */
export function Aurora() {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        uniforms,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    [],
  );
  useFrame(({ clock }) => {
    const c = useConditions.getState();
    const e = effective(c.mode, c.spaceWeather, activeShowers(sky.simMs).length > 0, c.dramatic);
    uniforms.uEdgeDeg.value = auroraEdgeDeg(e.kp);
    // Faint at quiet times, bright in a storm.
    uniforms.uStrength.value = Math.min(0.15 + Math.max(e.kp - 2, 0) * 0.15, 1);
    uniforms.uTime.value = clock.elapsedTime;
  });
  return (
    <mesh material={material}>
      <sphereGeometry args={[SHELL, 128, 64]} />
    </mesh>
  );
}
