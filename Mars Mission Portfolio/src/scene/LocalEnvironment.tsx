"use client";

import { useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  BackSide,
  Color,
  Float32BufferAttribute,
  Mesh,
  MeshBasicMaterial,
  PMREMGenerator,
  Scene,
  SphereGeometry,
  type Texture,
} from "three";
import { local, smoothstep } from "./localRuntime";

/** Gradient sphere: one colour above the horizon, another below, blended across it. */
function gradientScene(above: Color, horizon: Color, below: Color): Scene {
  const geometry = new SphereGeometry(1, 32, 16);
  const pos = geometry.getAttribute("position");
  const colors: number[] = [];
  const c = new Color();
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    if (y >= 0) c.copy(horizon).lerp(above, Math.min(y * 2.5, 1));
    else c.copy(horizon).lerp(below, Math.min(-y * 4, 1));
    colors.push(c.r, c.g, c.b);
  }
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  const scene = new Scene();
  scene.add(new Mesh(geometry, new MeshBasicMaterial({ vertexColors: true, side: BackSide })));
  return scene;
}

const maps: { pad: Texture | null; orbit: Texture | null } = { pad: null, orbit: null };

/**
 * Reflections for metal and foil. Polished metal shows what is around it,
 * so without this the gold blanket and nozzles render as dull brown. On the
 * pad the surroundings are sky and ground; in orbit, black space above and
 * the bright Earth below.
 */
export function LocalEnvironment() {
  const gl = useThree((s) => s.gl);

  useEffect(() => {
    const pmrem = new PMREMGenerator(gl);
    const pad = pmrem.fromScene(
      gradientScene(new Color(0.25, 0.45, 0.85), new Color(0.75, 0.8, 0.88), new Color(0.35, 0.32, 0.27)),
    ).texture;
    const orbit = pmrem.fromScene(
      gradientScene(new Color(0, 0, 0), new Color(0.35, 0.5, 0.8), new Color(0.55, 0.65, 0.8)),
    ).texture;
    maps.pad = pad;
    maps.orbit = orbit;
    pmrem.dispose();
    return () => {
      pad.dispose();
      orbit.dispose();
      maps.pad = null;
      maps.orbit = null;
    };
  }, [gl]);

  useFrame(({ scene }) => {
    const onGround = local.air.value > 0.05;
    const map = onGround ? maps.pad : maps.orbit;
    if (scene.environment !== map) scene.environment = map;
    scene.environmentIntensity = onGround
      ? 0.05 + 0.6 * local.daylight.value
      : 0.03 + 0.8 * smoothstep(-0.35, 0.5, local.sunDir.y);
  });

  return null;
}


