"use client";

import { useEffect, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, BufferAttribute, BufferGeometry, ShaderMaterial, Vector3 } from "three";
import starsVert from "@/shaders/stars.vert";
import starsFrag from "@/shaders/stars.frag";
import { eclipticToScene, equatorialToEcliptic } from "@/space/frames";
import { satellitesSchema, satPositionKm, type Satellites } from "@/space/satellites";
import { enckeState, VOYAGERS } from "@/space/sightings";
import { observer } from "@/state/observer";
import { EARNED_AFTER_S, tickPatience } from "@/state/patience";
import { useStore } from "@/state/store";
import { frame } from "../missionRuntime";
import { EARTH_RADIUS_KM, PLANET_SCENE_DISTANCE } from "../scale";
import { sky } from "../skyRuntime";
import { magToFlux, magToSize } from "../starColor";
import { pixelRatio } from "../Starfield";

/** One slot each for the comet and the two Voyagers, then the ISS and a Starlink train. */
const FIXED = 3;
const MAX = FIXED + 1 + 60;

/** What the HUD reads: what is in view right now, and how far. */
export const sightings = {
  comet: { shown: false, sunAu: 0, fromUsAu: 0, mag: 99 },
  voyager: false,
  iss: null as number | null,
  train: null as { count: number; km: number } | null,
};

const geometry = new BufferGeometry();
geometry.setAttribute("position", new BufferAttribute(new Float32Array(MAX * 3), 3));
geometry.setAttribute("aColor", new BufferAttribute(new Float32Array(MAX * 3), 3));
geometry.setAttribute("aSize", new BufferAttribute(new Float32Array(MAX), 1));
const v = new Vector3();
const ship = new Vector3();

/**
 * Total magnitude of a comet: H + 5 log(distance from us) + 2.5 n log(distance
 * from the Sun). For Encke, H about 11.5 and n about 4 fit its recent returns.
 */
function cometMagnitude(sunAu: number, usAu: number): number {
  return 11.5 + 5 * Math.log10(usAu) + 10 * Math.log10(sunAu);
}

function eqToScene(raDeg: number, decDeg: number): Vector3 {
  const ra = (raDeg * Math.PI) / 180;
  const dec = (decDeg * Math.PI) / 180;
  return v.set(...eclipticToScene(equatorialToEcliptic([Math.cos(dec) * Math.cos(ra), Math.cos(dec) * Math.sin(ra), Math.sin(dec)])));
}

/** F12: comet Encke, the Voyagers, the ISS and the newest Starlink train, where they really are. */
export function Sightings() {
  const [sats, setSats] = useState<Satellites | null>(null);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: starsVert,
        fragmentShader: starsFrag,
        uniforms: { uPixelRatio: pixelRatio },
        blending: AdditiveBlending,
        depthWrite: false,
        transparent: true,
      }),
    [],
  );

  useEffect(() => {
    let live = true;
    fetch("/api/satellites", { signal: AbortSignal.timeout(10_000) })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const p = satellitesSchema.safeParse(j);
        if (live && p.success) setSats(p.data);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  useFrame(() => {
    const waited = tickPatience(Date.now());
    const phase = useStore.getState().phase;
    const pos = geometry.getAttribute("position") as BufferAttribute;
    const col = geometry.getAttribute("aColor") as BufferAttribute;
    const size = geometry.getAttribute("aSize") as BufferAttribute;
    for (let i = 0; i < MAX; i++) size.setX(i, 0);

    const t = sky.simMs;
    const obs = observer.au ?? sky.helio.earth;
    // Comet: a real position, shown once earned.
    const c = enckeState(t).r;
    const rel: [number, number, number] = [c[0] - obs[0], c[1] - obs[1], c[2] - obs[2]];
    const usAu = Math.hypot(...rel);
    const sunAu = Math.hypot(...c);
    const mag = cometMagnitude(sunAu, usAu);
    const cometOn = waited >= EARNED_AFTER_S.comet;
    sightings.comet = { shown: cometOn, sunAu, fromUsAu: usAu, mag };
    if (cometOn) {
      v.set(...eclipticToScene(rel)).normalize().multiplyScalar(PLANET_SCENE_DISTANCE);
      pos.setXYZ(0, v.x, v.y, v.z);
      // Drawn at least faintly so it can be found; the HUD gives the true magnitude.
      const m = Math.min(mag, 5.5);
      const f = magToFlux(m);
      col.setXYZ(0, 0.75 * f, f, 0.9 * f);
      size.setX(0, magToSize(m) * 1.4);
    }

    // The Voyagers, far enough away that their direction is the same from anywhere in the inner solar system.
    const voyagerOn = phase === "transit" && waited >= EARNED_AFTER_S.voyager;
    sightings.voyager = voyagerOn;
    VOYAGERS.forEach((p, k) => {
      if (!voyagerOn) return;
      eqToScene(p.raDeg, p.decDeg).multiplyScalar(PLANET_SCENE_DISTANCE);
      pos.setXYZ(1 + k, v.x, v.y, v.z);
      // Far too faint to see; marked so the plaque has something to point at.
      col.setXYZ(1 + k, 0.4, 0.5, 0.7);
      size.setX(1 + k, 3);
    });

    // Satellites near Earth, in Earth radii around Earth's centre.
    sightings.iss = null;
    sightings.train = null;
    if (phase === "orbit" && sats) {
      const toScene = (km: [number, number, number]) =>
        v.set(...eclipticToScene(equatorialToEcliptic(km))).divideScalar(EARTH_RADIUS_KM);
      const shipUnits = ship.copy(frame.originKm).divideScalar(EARTH_RADIUS_KM);
      if (sats.iss) {
        toScene(satPositionKm(sats.iss, t));
        pos.setXYZ(FIXED, v.x, v.y, v.z);
        col.setXYZ(FIXED, 3, 3, 2.8);
        size.setX(FIXED, 4);
        sightings.iss = v.distanceTo(shipUnits) * EARTH_RADIUS_KM;
      }
      let nearest = Infinity;
      sats.train.forEach((o, k) => {
        toScene(satPositionKm(o, t));
        pos.setXYZ(FIXED + 1 + k, v.x, v.y, v.z);
        col.setXYZ(FIXED + 1 + k, 1.2, 1.2, 1.1);
        size.setX(FIXED + 1 + k, 2.5);
        nearest = Math.min(nearest, v.distanceTo(shipUnits) * EARTH_RADIUS_KM);
      });
      if (sats.train.length) sightings.train = { count: sats.train.length, km: nearest };
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
    size.needsUpdate = true;
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
