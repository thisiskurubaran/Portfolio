import { BufferAttribute, BufferGeometry, Color, Vector3 } from "three";
import { MOON_DIR } from "./palette";

const AMBIENT = 0.38;

/**
 * Bakes flat moonlight into per vertex colors so static meshes need no real
 * light. Only the beam gets a real light, which keeps the shader cost flat.
 * Returns a non-indexed geometry with only position and color, ready to merge.
 */
export function bakeFlat(
  source: BufferGeometry,
  hex: string,
  ambient = AMBIENT,
  /** Paint upward facing faces with this colour instead, for winter snow. */
  snowHex?: string,
): BufferGeometry {
  const g = source.index ? source.toNonIndexed() : source.clone();
  g.deleteAttribute("uv");
  g.deleteAttribute("normal");
  g.computeVertexNormals();

  const base = new Color(hex);
  const snow = snowHex ? new Color(snowHex) : null;
  const normals = g.getAttribute("normal");
  const colors = new Float32Array(normals.count * 3);
  const n = new Vector3();
  const c = new Color();

  for (let i = 0; i < normals.count; i++) {
    n.fromBufferAttribute(normals, i);
    const light = ambient + (1 - ambient) * Math.max(0, n.dot(MOON_DIR));
    // Snow settles on faces that point mostly up.
    c.copy(snow && n.y > 0.55 ? snow : base).multiplyScalar(light);
    colors.set([c.r, c.g, c.b], i * 3);
  }

  g.setAttribute("color", new BufferAttribute(colors, 3));
  g.deleteAttribute("normal");
  return g;
}

/** Stable 0..1 noise from a position, so shared vertices move together. */
export function hash3(x: number, y: number, z: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return s - Math.floor(s);
}
