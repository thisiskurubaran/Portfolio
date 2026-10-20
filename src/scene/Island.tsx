"use client";

import { useMemo } from "react";
import { BoxGeometry, BufferGeometry, ConeGeometry, CylinderGeometry, IcosahedronGeometry } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { bakeFlat, hash3 } from "./bake";
import { LANTERN_Y, ROCK_TOP, TOWER_HEIGHT } from "./layout";

// Placeholders until the Blender models land. Everything static merges into
// one geometry so the island costs a single draw call.

const ROCK_SCALE = { x: 10, y: 4.2, z: 8.5 };
const ROCK_FLAT_TOP = 0.72;

function rock(): BufferGeometry {
  const g = new IcosahedronGeometry(1, 1);
  const pos = g.getAttribute("position");
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const j = 0.82 + hash3(x, y, z) * 0.3;
    // Flat top so the tower and hut have somewhere to stand.
    pos.setXYZ(i, x * j, Math.min(y * j, ROCK_FLAT_TOP), z * j);
  }
  g.scale(ROCK_SCALE.x, ROCK_SCALE.y, ROCK_SCALE.z);
  g.translate(0, ROCK_TOP - ROCK_FLAT_TOP * ROCK_SCALE.y, 0);
  return bakeFlat(g, "#3b3f45");
}

function tower(): BufferGeometry[] {
  const parts: BufferGeometry[] = [];
  const bands = 4;
  const h = TOWER_HEIGHT / bands;
  const bottom = 1.25;
  const top = 0.85;
  for (let i = 0; i < bands; i++) {
    const r0 = bottom + (top - bottom) * (i / bands);
    const r1 = bottom + (top - bottom) * ((i + 1) / bands);
    const g = new CylinderGeometry(r1, r0, h, 10, 1, true);
    g.translate(0, ROCK_TOP + h * (i + 0.5), 0);
    parts.push(bakeFlat(g, i % 2 === 0 ? "#d9d4c7" : "#9b2f2a"));
  }

  const deck = new CylinderGeometry(1.35, 1.2, 0.25, 12);
  deck.translate(0, ROCK_TOP + TOWER_HEIGHT + 0.125, 0);
  parts.push(bakeFlat(deck, "#2b2d31"));

  const roof = new ConeGeometry(1.0, 1.1, 10);
  roof.translate(0, LANTERN_Y + 0.75 + 0.55, 0);
  parts.push(bakeFlat(roof, "#7d2622"));
  return parts;
}

function hut(): BufferGeometry[] {
  const walls = new BoxGeometry(2.6, 1.6, 2);
  walls.rotateY(0.35);
  walls.translate(3.6, ROCK_TOP + 0.8, 1.4);

  const roof = new ConeGeometry(2.1, 1.1, 4);
  roof.rotateY(Math.PI / 4 + 0.35);
  roof.translate(3.6, ROCK_TOP + 1.6 + 0.55, 1.4);

  return [bakeFlat(walls, "#bfb6a3"), bakeFlat(roof, "#4a2f26")];
}

function jetty(): BufferGeometry[] {
  const parts: BufferGeometry[] = [];
  const deck = new BoxGeometry(8, 0.2, 1.4);
  deck.translate(13, 0.8, -4);
  parts.push(bakeFlat(deck, "#6b5440"));

  for (let i = 0; i < 4; i++) {
    for (const side of [-0.6, 0.6]) {
      const post = new CylinderGeometry(0.1, 0.12, 3, 5);
      post.translate(10 + i * 2.2, -0.7, -4 + side);
      parts.push(bakeFlat(post, "#4a3a2c"));
    }
  }
  return parts;
}

export function Island() {
  const geometry = useMemo(() => mergeGeometries([rock(), ...tower(), ...hut(), ...jetty()]), []);

  return (
    <group>
      <mesh geometry={geometry}>
        <meshBasicMaterial vertexColors />
      </mesh>
      {/* Lantern glass stays unlit so it reads as the light source. */}
      <mesh position={[0, LANTERN_Y, 0]}>
        <cylinderGeometry args={[0.7, 0.7, 1.5, 10]} />
        <meshBasicMaterial color="#ffd98a" />
      </mesh>
    </group>
  );
}
