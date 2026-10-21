"use client";

import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, BufferAttribute, BufferGeometry, LineBasicMaterial, Vector3 } from "three";
import { eclipticToScene, equatorialToEcliptic } from "@/space/frames";
import { activeShowers, type Shower } from "@/space/meteors";
import { effective, useConditions } from "@/state/conditions";
import { useStore } from "@/state/store";
import { frame } from "../missionRuntime";
import { sky } from "../skyRuntime";

const MAX = 24;
/** Speed for a staged shower: the Geminids', the strongest of the year. */
const STAGED = { raDeg: 112, decDeg: 33, speedKmS: 35 } as Shower;
/** Meteors burn out about 100 km up: in Earth radii. */
const BURN = 1 + 100 / 6371;
const LIFE_S = 0.8;
/**
 * From orbit the crew looks down on a huge area of sky at once, and the
 * rate is sped up past real time so a shower shows inside a minute. Kept
 * as a plain factor so it is easy to say how far from real it is.
 */
const RATE_BOOST = 0.15;

const positions = new Float32Array(MAX * 6);
const colors = new Float32Array(MAX * 6);
const pool = Array.from({ length: MAX }, () => ({ age: LIFE_S, start: new Vector3(), dir: new Vector3() }));
const geometry = new BufferGeometry();
geometry.setAttribute("position", new BufferAttribute(positions, 3));
geometry.setAttribute("color", new BufferAttribute(colors, 3));
const radiant = new Vector3();
const nadir = new Vector3();
const p = new Vector3();
const t1 = new Vector3();
const t2 = new Vector3();

function radiantOf(s: Shower): Vector3 {
  const ra = (s.raDeg * Math.PI) / 180;
  const dec = (s.decDeg * Math.PI) / 180;
  const eq: [number, number, number] = [Math.cos(dec) * Math.cos(ra), Math.cos(dec) * Math.sin(ra), Math.sin(dec)];
  return radiant.set(...eclipticToScene(equatorialToEcliptic(eq))).normalize();
}

/** F05: a real shower active today, seen from Earth orbit as streaks in the air below. */
export function Meteors() {
  const material = useMemo(
    () => new LineBasicMaterial({ vertexColors: true, transparent: true, blending: AdditiveBlending, depthWrite: false }),
    [],
  );

  useFrame((_, delta) => {
    const phase = useStore.getState().phase;
    const c = useConditions.getState();
    const live = activeShowers(sky.simMs);
    const e = effective(c.mode, c.spaceWeather, live.length > 0, c.dramatic);
    // Staged showers borrow the strongest real one of the year.
    const shower = live[0]?.shower ?? (e.meteors ? STAGED : null);
    const rate = e.staged ? 40 : (live[0]?.rate ?? 0);
    const on = phase === "orbit" && e.meteors && shower !== null;

    // Age first, so a meteor born this frame is drawn at least once.
    for (const m of pool) m.age += delta;
    // Expected count this frame, so slow frames do not thin the shower out.
    const want = on ? Math.floor(rate * RATE_BOOST * Math.min(delta, 0.5) + Math.random()) : 0;
    for (let n = 0; shower && n < want; n++) {
      const m = pool.find((q) => q.age >= LIFE_S);
      if (m) {
        // Somewhere within a couple of thousand km of the point below the ship.
        nadir.copy(frame.originKm).normalize();
        t1.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).cross(nadir).normalize();
        p.copy(nadir).addScaledVector(t1, (Math.random() * 2000) / 6371).normalize();
        // A staged shower has its radiant high over the ship, so it is in view whatever the hour.
        const r = e.staged ? radiant.copy(nadir).addScaledVector(t1, 0.6).normalize() : radiantOf(shower);
        // Only the hemisphere facing the radiant sees the shower.
        if (p.dot(r) > 0) {
          m.age = 0;
          m.start.copy(p).multiplyScalar(BURN + 0.004);
          // Meteors travel away from the radiant, projected along the ground.
          m.dir.copy(r).negate().addScaledVector(p, r.dot(p)).normalize();
          m.dir.multiplyScalar((shower.speedKmS * 1.2) / 6371);
        }
      }
    }

    pool.forEach((m, i) => {
      const alive = m.age < LIFE_S;
      const k = alive ? m.age / LIFE_S : 1;
      // A meteor flares at once and fades as it burns out, its streak lengthening.
      const head = 0.4 + k * 1.2;
      t2.copy(m.start).addScaledVector(m.dir, head);
      const tail = t1.copy(m.start).addScaledVector(m.dir, Math.max(head - 1, 0));
      positions.set([tail.x, tail.y, tail.z, t2.x, t2.y, t2.z], i * 6);
      // Lines are one pixel wide; well past the bloom threshold they read as a glowing streak.
      const b = alive ? 8 * (1 - k) : 0;
      colors.set([0, 0, 0, b, b * 0.95, b * 0.8], i * 6);
    });
    geometry.attributes.position!.needsUpdate = true;
    geometry.attributes.color!.needsUpdate = true;
  });

  return <lineSegments geometry={geometry} material={material} frustumCulled={false} />;
}
