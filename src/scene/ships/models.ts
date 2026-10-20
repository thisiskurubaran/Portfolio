import { BoxGeometry, BufferAttribute, BufferGeometry, Color, CylinderGeometry } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { ShipKind } from "@/content/types";

// Placeholder hulls until the Blender models land. Bow points along -Z and
// the waterline sits at y = 0. Colors are albedo only: ships are lit by the
// beam in the ship shader, so nothing is baked here.

function painted(source: BufferGeometry, hex: string): BufferGeometry {
  const g = source.index ? source.toNonIndexed() : source.clone();
  g.deleteAttribute("uv");
  g.computeVertexNormals();
  const c = new Color(hex);
  const colors = new Float32Array(g.getAttribute("position").count * 3);
  for (let i = 0; i < colors.length; i += 3) colors.set([c.r, c.g, c.b], i);
  g.setAttribute("color", new BufferAttribute(colors, 3));
  return g;
}

/** A box pinched to a point at the bow and narrowed at the keel. */
function hull(width: number, height: number, length: number, freeboard: number): BufferGeometry {
  const g = new BoxGeometry(width, height, length, 1, 1, 2);
  const pos = g.getAttribute("position");
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    if (z < -length / 2 + 0.001) x *= 0.08;
    if (y < 0) x *= 0.55;
    pos.setX(i, x);
  }
  g.translate(0, freeboard - height / 2, 0);
  return g;
}

function box(w: number, h: number, l: number, x: number, y: number, z: number): BufferGeometry {
  const g = new BoxGeometry(w, h, l);
  g.translate(x, y + h / 2, z);
  return g;
}

function pole(radius: number, height: number, x: number, y: number, z: number): BufferGeometry {
  const g = new CylinderGeometry(radius, radius, height, 5);
  g.translate(x, y + height / 2, z);
  return g;
}

function sail(height: number, foot: number, y: number, z: number): BufferGeometry {
  const g = new BufferGeometry();
  // Triangle from the mast back along the boom, rendered double sided.
  g.setAttribute("position", new BufferAttribute(new Float32Array([0, y, z, 0, y + height, z, 0, y, z + foot]), 3));
  return g;
}

function rowboat(): BufferGeometry[] {
  return [painted(hull(1.1, 0.6, 2.8, 0.3), "#7a5a3a"), painted(box(1.0, 0.06, 0.3, 0, 0.25, 0.2), "#a88a62")];
}

function fishing(): BufferGeometry[] {
  return [
    painted(hull(2.0, 1.4, 6, 0.7), "#2f4f6f"),
    painted(box(1.5, 1.3, 1.8, 0, 0.7, 1.2), "#d8d2c4"),
    painted(pole(0.06, 3.4, 0, 0.7, -0.8), "#3a3a3a"),
    painted(box(0.06, 0.06, 2.4, 0, 3.0, 0.3), "#3a3a3a"),
  ];
}

function cargo(): BufferGeometry[] {
  const parts = [painted(hull(4.2, 2.6, 18, 1.4), "#7b2d24"), painted(box(3.8, 3.2, 2.6, 0, 1.4, 6.4), "#e4e0d6")];
  parts.push(painted(pole(0.35, 1.6, 0, 4.6, 6.8), "#2b2b2b"));
  const containerColors = ["#2f6f8f", "#c9762c", "#3f7a4a", "#8f2f2f", "#d1b44a"];
  for (let i = 0; i < 5; i++) {
    for (const x of [-1, 1]) {
      const c = containerColors[(i * 2 + (x > 0 ? 1 : 0)) % containerColors.length]!;
      parts.push(painted(box(1.8, 1.2, 2.2, x * 0.95, 1.4, -6.2 + i * 2.3), c));
    }
  }
  return parts;
}

function sailboat(): BufferGeometry[] {
  return [
    painted(hull(1.7, 1.0, 6.4, 0.5), "#e6e3dc"),
    painted(pole(0.06, 7.2, 0, 0.5, -0.8), "#c8c8c8"),
    painted(sail(6.6, 3.6, 1.0, -0.7), "#f2eee4"),
    painted(sail(5.2, -2.2, 0.9, -0.9), "#f2eee4"),
  ];
}

const builders: Record<ShipKind, () => BufferGeometry[]> = { rowboat, fishing, cargo, sailboat };
const cache = new Map<ShipKind, BufferGeometry>();

/** One merged geometry per ship kind, shared by every ship of that kind. */
export function shipGeometry(kind: ShipKind): BufferGeometry {
  let g = cache.get(kind);
  if (!g) {
    g = mergeGeometries(builders[kind]())!;
    cache.set(kind, g);
  }
  return g;
}

/** Rough size, used to damp rolling on big hulls and to size labels and hit areas. */
export const SHIP_LENGTH: Record<ShipKind, number> = { rowboat: 2.8, fishing: 6, cargo: 18, sailboat: 6.4 };
export const SHIP_HEIGHT: Record<ShipKind, number> = { rowboat: 0.6, fishing: 4, cargo: 6.2, sailboat: 7.6 };
