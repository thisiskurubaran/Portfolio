"use client";

import { useMemo, useRef } from "react";
import { type ThreeEvent, useFrame } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  type Group,
  type Mesh,
  ShaderMaterial,
  Vector3,
} from "three";
import starsVert from "@/shaders/stars.vert";
import starsFrag from "@/shaders/stars.frag";
import { bodies } from "@/content/bodies";
import { apparentMagnitude } from "@/space/magnitude";
import { useStore } from "@/state/store";
import { PLANET_SCENE_DISTANCE } from "./scale";
import { PLANETS, type PlanetId } from "@/space/elements";
import { sky } from "./skyRuntime";
import { magToFlux, magToSize } from "./starColor";
import { pixelRatio } from "./Starfield";

/** Approximate disc colours in linear RGB, normalised to the brightest channel. */
const TINT: Record<PlanetId, [number, number, number]> = {
  mercury: [1, 0.93, 0.86],
  venus: [1, 0.96, 0.86],
  earth: [0.6, 0.78, 1],
  mars: [1, 0.55, 0.32],
  jupiter: [1, 0.9, 0.76],
  saturn: [1, 0.86, 0.62],
  uranus: [0.72, 0.9, 1],
  neptune: [0.55, 0.7, 1],
};

// Large enough to tap on a phone: about 0.8 degrees across at this distance.
const HIT_RADIUS = 20;

function buildGeometry(): BufferGeometry {
  const n = PLANETS.length;
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array(n * 3), 3));
  g.setAttribute("aColor", new BufferAttribute(new Float32Array(n * 3), 3));
  g.setAttribute("aSize", new BufferAttribute(new Float32Array(n), 1));
  return g;
}

const p = new Vector3();

function updateGeometry(g: BufferGeometry): void {
  const pos = g.getAttribute("position") as BufferAttribute;
  const col = g.getAttribute("aColor") as BufferAttribute;
  const size = g.getAttribute("aSize") as BufferAttribute;
  PLANETS.forEach((id, i) => {
    const s = sky.planets[id];
    p.copy(s.dir).multiplyScalar(PLANET_SCENE_DISTANCE);
    pos.setXYZ(i, p.x, p.y, p.z);
    // The body under the observer's feet is not a point in its own sky.
    const here = id === sky.observerBody;
    const mag = apparentMagnitude(bodies[id].absMag, s.sunDistanceAu, s.distanceAu);
    const flux = here ? 0 : magToFlux(mag);
    const [r, gg, b] = TINT[id];
    col.setXYZ(i, r * flux, gg * flux, b * flux);
    size.setX(i, here ? 0 : magToSize(mag));
  });
  pos.needsUpdate = true;
  col.needsUpdate = true;
  size.needsUpdate = true;
}

/** F06: the planets as points of light where they really are in the sky today. */
export function Planets() {
  const geometry = useMemo(() => buildGeometry(), []);
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
  const hits = useRef<Partial<Record<PlanetId, Mesh | null>>>({});
  const marker = useRef<Group>(null);
  const selected = useStore((s) => s.selectedBody);
  const selectBody = useStore((s) => s.selectBody);

  useFrame(() => {
    updateGeometry(geometry);
    for (const id of PLANETS) {
      const hit = hits.current[id];
      if (!hit) continue;
      hit.visible = id !== sky.observerBody;
      hit.position.copy(sky.planets[id].dir).multiplyScalar(PLANET_SCENE_DISTANCE);
    }
    if (marker.current && selected) {
      marker.current.position.copy(sky.planets[selected].dir).multiplyScalar(PLANET_SCENE_DISTANCE);
    }
  });

  const onPick = (id: PlanetId) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    selectBody(id);
  };

  return (
    <>
      <points geometry={geometry} material={material} frustumCulled={false} />
      {PLANETS.map((id) => (
        <mesh
          key={id}
          ref={(m) => {
            hits.current[id] = m;
          }}
          onClick={onPick(id)}
          onPointerOver={() => (document.body.style.cursor = "pointer")}
          onPointerOut={() => (document.body.style.cursor = "")}
        >
          <sphereGeometry args={[HIT_RADIUS, 8, 8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
      {selected && (
        <group ref={marker}>
          <Billboard>
            <mesh>
              <ringGeometry args={[HIT_RADIUS * 0.9, HIT_RADIUS, 48]} />
              <meshBasicMaterial color="#9fd0ff" transparent opacity={0.8} depthWrite={false} />
            </mesh>
          </Billboard>
        </group>
      )}
    </>
  );
}
