"use client";

import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { DoubleSide, Mesh, ShaderMaterial, Vector3 } from "three";
import swirlVert from "@/shaders/swirl.vert";
import swirlFrag from "@/shaders/swirl.frag";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useSceneStore } from "@/state/store";
import { bearingDeg, distanceKm, type HazardStorm } from "@/weather/hazards";
import { compassDirection } from "./compass";
import { envRuntime } from "./envRuntime";
import { shipState } from "./ships/shipRuntime";

// On the horizon, inside the sky dome and past the fog.
const DISTANCE = 380;
const ELEVATION = 1.2;
const swirlTime = { value: 0 };
const dir = new Vector3();

export const stormKey = (id: string) => `storm:${id}`;

function Swirl({ storm, lat, lon }: { storm: HazardStorm; lat: number; lon: number }) {
  const km = distanceKm(lat, lon, storm.lat, storm.lon);
  const bearing = bearingDeg(lat, lon, storm.lat, storm.lon);
  // Stronger storms are bigger; far ones are fainter.
  const size = 30 + Math.min(1, (storm.windKmh ?? 100) / 250) * 40;
  const strength = 0.85 - Math.min(0.55, km / 20000);

  const position = useMemo(() => compassDirection(bearing, ELEVATION, new Vector3()).multiplyScalar(DISTANCE), [bearing]);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: swirlVert,
        fragmentShader: swirlFrag,
        transparent: true,
        depthWrite: false,
        side: DoubleSide,
        uniforms: {
          uTime: swirlTime,
          uStrength: { value: strength },
          // Lit like the sky around it, so it is faint at night and bright by day.
          uTint: envRuntime.zenith,
          uSouth: { value: storm.lat < 0 ? -1 : 1 },
        },
      }),
    [strength, storm.lat],
  );

  return (
    <mesh
      position={position}
      material={material}
      onUpdate={(m: Mesh) => m.lookAt(0, position.y, 0)}
      frustumCulled={false}
      renderOrder={-1}
    >
      <planeGeometry args={[size, size * 0.55]} />
    </mesh>
  );
}

/** F05: live tropical cyclones as slow swirls on the horizon, in their real direction. */
export function StormSwirls() {
  const storms = useSceneStore((s) => s.hazards?.storms ?? null);
  const loc = useSceneStore((s) => s.conditions?.location ?? null);
  const reducedMotion = useReducedMotion();

  useFrame((_, delta) => {
    if (!reducedMotion) swirlTime.value += delta;
    if (!storms || !loc) return;
    // Label anchors, projected to the screen by ShipTracker.
    for (const s of storms) {
      const bearing = bearingDeg(loc.lat, loc.lon, s.lat, s.lon);
      shipState(stormKey(s.id)).anchor.copy(compassDirection(bearing, ELEVATION + 4, dir).multiplyScalar(DISTANCE));
    }
  });

  // Without a location there is no honest direction to draw them in.
  if (!storms || !loc) return null;
  return (
    <group>
      {storms.map((s) => (
        <Swirl key={s.id} storm={s} lat={loc.lat} lon={loc.lon} />
      ))}
    </group>
  );
}
