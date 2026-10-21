"use client";

import { useEffect, useMemo, useState } from "react";
import { useThree } from "@react-three/fiber";
import { AdditiveBlending, BufferAttribute, BufferGeometry, ShaderMaterial } from "three";
import starsVert from "@/shaders/stars.vert";
import starsFrag from "@/shaders/stars.frag";
import { equatorialToScene, fromRaDec } from "@/space/frames";
import { toRad } from "@/space/time";
import { STAR_SPHERE_RADIUS } from "./scale";
import { bvToKelvin, kelvinToRgb, magToFlux, magToSize } from "./starColor";

/** Rows of [ra deg, dec deg, visual magnitude, B-V], Hipparcos stars to magnitude 6. */
type StarRow = [number, number, number, number];

export const pixelRatio = { value: 1 };

function buildGeometry(rows: StarRow[]): BufferGeometry {
  const positions = new Float32Array(rows.length * 3);
  const colors = new Float32Array(rows.length * 3);
  const sizes = new Float32Array(rows.length);
  rows.forEach(([ra, dec, mag, bv], i) => {
    const p = equatorialToScene(fromRaDec(toRad(ra), toRad(dec)));
    positions.set(
      p.map((c) => c * STAR_SPHERE_RADIUS),
      i * 3,
    );
    const flux = magToFlux(mag);
    const rgb = kelvinToRgb(bvToKelvin(bv));
    colors.set(
      rgb.map((c) => c * flux),
      i * 3,
    );
    sizes[i] = magToSize(mag);
  });
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(positions, 3));
  g.setAttribute("aColor", new BufferAttribute(colors, 3));
  g.setAttribute("aSize", new BufferAttribute(sizes, 1));
  return g;
}

/** Real stars at their catalogue positions, in the scene's ecliptic frame. */
export function Starfield() {
  const [rows, setRows] = useState<StarRow[] | null>(null);
  const dpr = useThree((s) => s.viewport.dpr);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/data/stars.json", { signal: controller.signal })
      .then((r) => r.json() as Promise<StarRow[]>)
      .then(setRows)
      .catch(() => {
        // An empty sky is a fine fallback; the rest of the scene still works.
      });
    return () => controller.abort();
  }, []);

  const geometry = useMemo(() => (rows ? buildGeometry(rows) : null), [rows]);
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
    pixelRatio.value = dpr;
  }, [dpr]);

  if (!geometry) return null;
  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={-2} />;
}
