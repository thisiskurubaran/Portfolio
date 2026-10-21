"use client";

import { type ReactNode, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { AU_KM } from "@/physics/constants";
import { eclipticToScene } from "@/space/frames";
import { useStore } from "@/state/store";
import { EARTH_RADIUS_KM } from "./scale";
import { sky } from "./skyRuntime";
import { transit, TRANSIT_UNIT_KM } from "./transitRuntime";

/**
 * Near Earth the sky layer is Earth centred in Earth radii, so Earth sits
 * at the origin at unit size. In the cruise the layer is ship centred in
 * millions of km, so Earth moves away and shrinks to its true size.
 */
export function EarthPlacement({ children }: { children: ReactNode }) {
  const group = useRef<Group>(null);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const phase = useStore.getState().phase;
    // At Mars, Earth is only a point of light; the planet list draws that.
    g.visible = phase !== "capture" && phase !== "marsOrbit";
    if (phase !== "transit") {
      g.position.set(0, 0, 0);
      g.scale.setScalar(1);
      return;
    }
    const e = sky.helio.earth;
    const s = transit.shipHelioKm;
    g.position
      .set(...eclipticToScene([e[0] * AU_KM - s.x, e[1] * AU_KM - s.y, e[2] * AU_KM - s.z]))
      .divideScalar(TRANSIT_UNIT_KM);
    g.scale.setScalar(EARTH_RADIUS_KM / TRANSIT_UNIT_KM);
  });

  return <group ref={group}>{children}</group>;
}
