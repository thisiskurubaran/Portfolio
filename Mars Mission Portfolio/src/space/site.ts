import { toRad } from "./time";

/**
 * Launch site: Satish Dhawan Space Centre, Sriharikota, about 80 km north
 * of Chennai. India's crewed launches fly from here.
 */
export const LAUNCH_SITE = {
  name: "Satish Dhawan Space Centre, Sriharikota",
  lat: toRad(13.72),
  lon: toRad(80.23),
} as const;

/**
 * Site position as a unit vector in Earth's body fixed frame, in the mesh
 * convention used by the scene: north pole on +y, longitude 0 on +x and
 * 90 E on -z.
 */
export function siteBodyVector(lat: number, lon: number): [number, number, number] {
  return [Math.cos(lat) * Math.cos(lon), Math.sin(lat), -Math.cos(lat) * Math.sin(lon)];
}
