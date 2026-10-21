"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";
import { AU_KM } from "@/physics/constants";
import { eclipticToScene } from "@/space/frames";
import { MOON_RADIUS_KM, moonGeocentric } from "@/space/moon";
import { useStore } from "@/state/store";
import { MOON_LOOK, rockyMaterial } from "./rockyMaterial";
import { EARTH_RADIUS_KM } from "./scale";
import { sky } from "./skyRuntime";
import { transit, TRANSIT_UNIT_KM } from "./transitRuntime";

const moon = rockyMaterial(MOON_LOOK);

/**
 * The Moon at its real position: in Earth radii around Earth before
 * departure, and relative to the ship in millions of km during the cruise.
 */
export function MoonBody() {
  const mesh = useRef<Mesh>(null);

  useFrame(() => {
    const m = mesh.current;
    if (!m) return;
    const g = moonGeocentric(sky.simMs);
    if (useStore.getState().phase === "transit") {
      const e = sky.helio.earth;
      const s = transit.shipHelioKm;
      m.position
        .set(...eclipticToScene([e[0] * AU_KM + g[0] - s.x, e[1] * AU_KM + g[1] - s.y, e[2] * AU_KM + g[2] - s.z]))
        .divideScalar(TRANSIT_UNIT_KM);
      m.scale.setScalar(MOON_RADIUS_KM / TRANSIT_UNIT_KM);
    } else {
      m.position.set(...eclipticToScene(g)).divideScalar(EARTH_RADIUS_KM);
      m.scale.setScalar(MOON_RADIUS_KM / EARTH_RADIUS_KM);
    }
    // Earth and Moon share the same sunlight direction to within a fraction of a degree.
    moon.uniforms.uSunDir.value.copy(sky.sunDir);
  });

  return (
    <mesh ref={mesh} material={moon.material}>
      {/* Dense enough that the limb stays round from low lunar orbit. */}
      <sphereGeometry args={[1, 256, 128]} />
    </mesh>
  );
}
