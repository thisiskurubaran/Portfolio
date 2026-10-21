"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  type Group,
  Line,
  LineBasicMaterial,
  type Mesh,
  Points,
  PointsMaterial,
  Vector3,
} from "three";
import { AU_KM } from "@/physics/constants";
import { propagate, stateFromElements } from "@/physics/kepler";
import { GM_SUN_KM } from "@/physics/transfer";
import { elementsAt, type PlanetId } from "@/space/elements";
import { eclipticToScene } from "@/space/frames";
import { useStore } from "@/state/store";
import { sky } from "../skyRuntime";
import { MARS_LOOK, rockyMaterial } from "../rockyMaterial";
import { L2_DISTANCE_KM, MARS_RADIUS_KM, transit, TRANSIT_UNIT_KM } from "../transitRuntime";

const AU_UNITS = AU_KM / TRANSIT_UNIT_KM;

function orbitGeometry(id: PlanetId, ms: number): BufferGeometry {
  // One full orbit from the current elements; they barely drift over one orbit.
  const el = elementsAt(id, ms);
  const pts: number[] = [];
  for (let i = 0; i <= 256; i++) {
    const s = stateFromElements({ ...el, L: el.L + (i / 256) * 2 * Math.PI }, 1);
    pts.push(...eclipticToScene([s.r[0] * AU_UNITS, s.r[1] * AU_UNITS, s.r[2] * AU_UNITS]));
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array(pts), 3));
  return g;
}

function transferGeometry(): { arc: BufferGeometry; stations: BufferGeometry } | null {
  const plan = transit.plan;
  const el = transit.elements;
  if (!plan || !el) return null;
  const at = (ms: number) => {
    const s = stateFromElements(propagate(el, GM_SUN_KM, (ms - plan.departMs) / 1000), GM_SUN_KM);
    return eclipticToScene([s.r[0] / TRANSIT_UNIT_KM, s.r[1] / TRANSIT_UNIT_KM, s.r[2] / TRANSIT_UNIT_KM]);
  };
  const pts: number[] = [];
  for (let i = 0; i <= 200; i++) pts.push(...at(plan.departMs + (i / 200) * (plan.arriveMs - plan.departMs)));
  const arc = new BufferGeometry();
  arc.setAttribute("position", new BufferAttribute(new Float32Array(pts), 3));
  const stations = new BufferGeometry();
  const stationTimes = transit.visits.filter((v) => v.kind === "station").map((v) => v.tMs);
  stations.setAttribute("position", new BufferAttribute(new Float32Array(stationTimes.flatMap(at)), 3));
  return { arc, stations };
}

const ship = new Vector3();
const mars3d = rockyMaterial(MARS_LOOK);
const l2Point = new BufferGeometry();
l2Point.setAttribute("position", new BufferAttribute(new Float32Array(3), 3));

/**
 * What the crew sees in the cruise beyond the Sun and stars: the orbits of
 * Earth and Mars, the transfer ellipse being flown, the stations on it, and
 * Mars itself as it grows ahead. Everything sits in a heliocentric group
 * shifted so the ship is at the origin.
 */
export function TransitSky() {
  const phase = useStore((s) => s.phase);
  const root = useRef<Group>(null);
  const mars = useRef<Mesh>(null);

  // Rebuilt when the cruise starts, since the transfer is only fixed at the burn.
  const geo = useMemo(
    () => ({
      earth: orbitGeometry("earth", sky.simMs),
      mars: orbitGeometry("mars", sky.simMs),
      transfer: phase === "transit" ? transferGeometry() : null,
    }),
    [phase],
  );
  const mats = useMemo(
    () => ({
      earth: new LineBasicMaterial({ color: new Color(0.25, 0.45, 0.9), transparent: true, opacity: 0.45 }),
      marsOrbit: new LineBasicMaterial({ color: new Color(0.9, 0.45, 0.25), transparent: true, opacity: 0.45 }),
      transfer: new LineBasicMaterial({ color: new Color(1.4, 1.1, 0.6), transparent: true, opacity: 0.85 }),
      stations: new PointsMaterial({
        color: new Color(2, 1.6, 0.9),
        size: 6,
        sizeAttenuation: false,
        blending: AdditiveBlending,
        depthWrite: false,
        transparent: true,
      }),
      l2: new PointsMaterial({
        color: new Color(0.6, 0.8, 2),
        size: 7,
        sizeAttenuation: false,
        blending: AdditiveBlending,
        depthWrite: false,
        transparent: true,
      }),
    }),
    [],
  );
  const lines = useMemo(() => {
    const out = [new Line(geo.earth, mats.earth), new Line(geo.mars, mats.marsOrbit)];
    if (geo.transfer) out.push(new Line(geo.transfer.arc, mats.transfer));
    return out;
  }, [geo, mats]);
  const stationPoints = useMemo(
    () => (geo.transfer ? new Points(geo.transfer.stations, mats.stations) : null),
    [geo, mats],
  );
  const l2 = useMemo(() => new Points(l2Point, mats.l2), [mats]);

  useFrame(() => {
    if (!root.current) return;
    const p = transit.shipHelioKm;
    ship.set(...eclipticToScene([p.x, p.y, p.z])).divideScalar(TRANSIT_UNIT_KM);
    root.current.position.copy(ship).negate();
    if (mars.current) {
      const m = sky.helio.mars;
      mars.current.position.set(...eclipticToScene([m[0] * AU_UNITS, m[1] * AU_UNITS, m[2] * AU_UNITS]));
      mars.current.scale.setScalar(MARS_RADIUS_KM / TRANSIT_UNIT_KM);
      mars3d.uniforms.uSunDir.value.copy(mars.current.position).normalize().negate();
      mars3d.uniforms.uSunIntensity.value = 1.6 / sky.planets.mars.sunDistanceAu ** 2;
    }
    // L2 marker, straight out from the Sun past Earth, relative to the ship.
    const e = sky.helio.earth;
    const en = Math.hypot(...e);
    const k = (en * AU_KM + L2_DISTANCE_KM) / en;
    const lp = eclipticToScene([e[0] * k - p.x, e[1] * k - p.y, e[2] * k - p.z]);
    l2Point.getAttribute("position").setXYZ(0, lp[0] / TRANSIT_UNIT_KM, lp[1] / TRANSIT_UNIT_KM, lp[2] / TRANSIT_UNIT_KM);
    l2Point.getAttribute("position").needsUpdate = true;
  });

  if (phase !== "transit") return null;
  return (
    <>
      <primitive object={l2} />
      <group ref={root}>
        {lines.map((l, i) => (
          <primitive key={i} object={l} />
        ))}
        {stationPoints && <primitive object={stationPoints} />}
        <mesh ref={mars} material={mars3d.material}>
          <sphereGeometry args={[1, 64, 32]} />
        </mesh>
      </group>
    </>
  );
}
