import { DataTexture, MeshStandardMaterial, RedFormat, RepeatWrapping, LinearFilter } from "three";

/**
 * Crinkle pattern for multi layer insulation. Real thermal blankets are
 * aluminised Kapton that wrinkles into small creased facets; a smoothed
 * noise bump map gives the same broken highlights.
 */
function crinkleTexture(size = 128): DataTexture {
  const raw = new Float32Array(size * size);
  for (let i = 0; i < raw.length; i++) raw[i] = Math.random();
  const data = new Uint8Array(size * size);
  // One box blur pass softens single pixel noise into creases.
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let sum = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          sum += raw[((y + dy + size) % size) * size + ((x + dx + size) % size)]!;
        }
      }
      data[y * size + x] = Math.round((sum / 9) * 255);
    }
  }
  const tex = new DataTexture(data, size, size, RedFormat);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.magFilter = LinearFilter;
  tex.repeat.set(6, 3);
  tex.needsUpdate = true;
  return tex;
}

const crinkle = crinkleTexture();

export const materials = {
  paint: new MeshStandardMaterial({ color: "#e4e4e0", roughness: 0.55, metalness: 0 }),
  black: new MeshStandardMaterial({ color: "#1c1c1e", roughness: 0.6, metalness: 0.1 }),
  nozzle: new MeshStandardMaterial({ color: "#3a3836", roughness: 0.38, metalness: 0.85 }),
  // Gold coloured outer layer of the thermal blanket on the service module.
  gold: new MeshStandardMaterial({
    color: "#d6a23f",
    roughness: 0.32,
    metalness: 0.75,
    bumpMap: crinkle,
    bumpScale: 1.5,
  }),
  radiator: new MeshStandardMaterial({ color: "#eef0f2", roughness: 0.4, metalness: 0.05 }),
  capsule: new MeshStandardMaterial({ color: "#c9cdd3", roughness: 0.48, metalness: 0.25 }),
  heatShield: new MeshStandardMaterial({ color: "#3a2a20", roughness: 0.9, metalness: 0 }),
  cells: new MeshStandardMaterial({ color: "#14224a", roughness: 0.22, metalness: 0.55 }),
  frame: new MeshStandardMaterial({ color: "#8a8c90", roughness: 0.45, metalness: 0.7 }),
  steel: new MeshStandardMaterial({ color: "#5b4e48", roughness: 0.8, metalness: 0.3 }),
};
