import { Vector3 } from "three";

const RAD = Math.PI / 180;

/**
 * World direction for a compass bearing and elevation. The camera looks along
 * -Z, which is treated as south, so east is to the left and west to the right.
 */
export function compassDirection(azimuth: number, elevation: number, out: Vector3): Vector3 {
  const a = azimuth * RAD;
  const e = elevation * RAD;
  return out.set(-Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e));
}
