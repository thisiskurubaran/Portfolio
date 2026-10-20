import { Vector2 } from "three";

/**
 * Sea values as drawn this frame. The water shader holds these objects as
 * uniforms, and ships sample the same numbers so they ride the waves you see.
 */
export const seaRuntime = {
  time: { value: 0 },
  /** Eased toward the store's seaState so weather changes roll in. */
  seaState: { value: 0.25 },
  windDir: { value: new Vector2(0.3, -1).normalize() },
};

// Keep in sync with the gerstner() calls in shaders/water.vert.
// [rotation from wind, wavelength, amplitude share]
const WAVES: [number, number, number][] = [
  [0, 38, 0.55],
  [0.6, 21, 0.3],
  [-0.45, 13, 0.18],
  [1.3, 7, 0.1],
];

/**
 * Water height at a world position. Ignores the sideways Gerstner shift,
 * which is fine for bobbing boats and much cheaper than solving for it.
 */
export function waveHeight(x: number, z: number): number {
  const s = Math.min(1, Math.max(0, seaRuntime.seaState.value));
  const amp = 0.25 + (3.2 - 0.25) * s * s;
  const speed = 0.55 + (1.4 - 0.55) * s;
  const t = seaRuntime.time.value;
  const w = seaRuntime.windDir.value;

  let y = 0;
  for (const [rot, wavelength, share] of WAVES) {
    const c = Math.cos(rot);
    const sn = Math.sin(rot);
    const dx = c * w.x - sn * w.y;
    const dz = sn * w.x + c * w.y;
    const k = (Math.PI * 2) / wavelength;
    const phaseSpeed = Math.sqrt(9.8 / k) * speed;
    y += amp * share * Math.sin(k * (dx * x + dz * z - phaseSpeed * t));
  }
  return y;
}
