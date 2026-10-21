/**
 * Procedural terrain around the landing site. There is no MOLA elevation
 * grid in the build yet, so the ground is generated: rolling plains, a few
 * impact craters with raised rims (the shape real craters of this size
 * have, about 1:5 depth to diameter), and scattered rocks. Deterministic per
 * site, so every visit to a site looks the same.
 */
export const TERRAIN_SIZE_M = 600;
/** Grid cells per side; heights are sampled at (CELLS + 1)^2 points. */
export const TERRAIN_CELLS = 150;

export type Crater = { x: number; z: number; radius: number };

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    // mulberry32
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Terrain = {
  height: (x: number, z: number) => number;
  craters: Crater[];
  rocks: { x: number; z: number; size: number }[];
};

export function makeTerrain(siteId: string): Terrain {
  const rand = seededRandom(hashString(siteId));
  const waves = Array.from({ length: 6 }, (_, i) => ({
    kx: (rand() - 0.5) * 0.02 * (i + 1),
    kz: (rand() - 0.5) * 0.02 * (i + 1),
    phase: rand() * Math.PI * 2,
    amp: 2.2 / (i + 1),
  }));
  const craters: Crater[] = [];
  for (let i = 0; i < 7; i++) {
    const radius = 12 + rand() * 38;
    const angle = rand() * Math.PI * 2;
    // Keep the landing point itself clear.
    const dist = 70 + rand() * 200;
    craters.push({ x: Math.cos(angle) * dist, z: Math.sin(angle) * dist, radius });
  }

  const height = (x: number, z: number) => {
    let h = 0;
    for (const w of waves) h += w.amp * Math.sin(w.kx * x + w.kz * z + w.phase);
    for (const c of craters) {
      const d = Math.hypot(x - c.x, z - c.z) / c.radius;
      const depth = c.radius * 0.2;
      // Bowl inside, raised rim at the edge, ejecta falling away outside.
      if (d < 1) h += depth * (d * d - 1) + depth * 0.35 * Math.pow(d, 6);
      else h += depth * 0.35 * Math.exp(-(d - 1) * 3.5);
    }
    // Flatten the landing zone so the lander sits level.
    const pad = Math.hypot(x, z);
    if (pad < 25) h *= Math.min(1, Math.pow(pad / 25, 2));
    return h;
  };

  const rocks: Terrain["rocks"] = [];
  for (let i = 0; i < 260; i++) {
    const x = (rand() - 0.5) * TERRAIN_SIZE_M * 0.95;
    const z = (rand() - 0.5) * TERRAIN_SIZE_M * 0.95;
    if (Math.hypot(x, z) < 20) continue;
    // Size follows a steep power law, as on real fields: many pebbles, few boulders.
    rocks.push({ x, z, size: 0.15 + Math.pow(rand(), 6) * 1.6 });
  }
  return { height, craters, rocks };
}

/** Heights on the grid, row major by x then z, for the mesh and the physics collider. */
export function sampleHeights(t: Terrain): Float32Array {
  const n = TERRAIN_CELLS + 1;
  const out = new Float32Array(n * n);
  const step = TERRAIN_SIZE_M / TERRAIN_CELLS;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      out[i * n + j] = t.height(-TERRAIN_SIZE_M / 2 + i * step, -TERRAIN_SIZE_M / 2 + j * step);
    }
  }
  return out;
}
