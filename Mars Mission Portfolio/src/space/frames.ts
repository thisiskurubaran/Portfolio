import { toRad } from "./time";

export type Vec3 = [number, number, number];

/** Mean obliquity of the ecliptic at J2000. Drifts by under 0.01 degrees a century. */
export const OBLIQUITY = toRad(23.43929);

/**
 * The scene uses the ecliptic as its ground plane: three.js +y is ecliptic
 * north, +x points at the March equinox, and ecliptic +y maps to three.js -z
 * so the frame stays right handed.
 */
export function eclipticToScene([x, y, z]: Vec3): Vec3 {
  return [x, z, -y];
}

export function equatorialToEcliptic([x, y, z]: Vec3): Vec3 {
  const c = Math.cos(OBLIQUITY);
  const s = Math.sin(OBLIQUITY);
  return [x, y * c + z * s, -y * s + z * c];
}

export function equatorialToScene(v: Vec3): Vec3 {
  return eclipticToScene(equatorialToEcliptic(v));
}

/**
 * Accumulated general precession in longitude since J2000, in radians.
 * 5029 arcseconds per century; the slower tilt of the ecliptic itself is
 * ignored, which costs under 0.01 degrees this century.
 */
export function precessionSinceJ2000(centuries: number): number {
  return toRad((5029.0966 / 3600) * centuries);
}

/** Moves an ecliptic vector of date back to the J2000 ecliptic. */
export function eclipticOfDateToJ2000([x, y, z]: Vec3, centuries: number): Vec3 {
  const p = -precessionSinceJ2000(centuries);
  const c = Math.cos(p);
  const s = Math.sin(p);
  return [x * c - y * s, x * s + y * c, z];
}

/** Unit vector from right ascension and declination, both in radians. */
export function fromRaDec(ra: number, dec: number): Vec3 {
  const c = Math.cos(dec);
  return [c * Math.cos(ra), c * Math.sin(ra), Math.sin(dec)];
}

/** Unit vector in the ecliptic plane at the given ecliptic longitude. */
export function fromEclipticLon(lon: number): Vec3 {
  return [Math.cos(lon), Math.sin(lon), 0];
}

/**
 * Scene space axes of a body fixed frame whose mesh has its north pole on
 * local +y and longitude 0 on local +x. three.js sphere UVs put longitude 0
 * at +x and 90 E at -z, which is what this basis expects.
 */
export function earthBasis(gmstRad: number, centuries: number): { x: Vec3; y: Vec3; z: Vec3 } {
  // Sidereal time counts from the equinox of date, so the body frame is
  // built in that frame and then precessed back to the scene's J2000 frame.
  const toScene = (v: Vec3) =>
    eclipticToScene(eclipticOfDateToJ2000(equatorialToEcliptic(v), centuries));
  const lon0: Vec3 = [Math.cos(gmstRad), Math.sin(gmstRad), 0];
  const lon90e: Vec3 = [-Math.sin(gmstRad), Math.cos(gmstRad), 0];
  const z = toScene(lon90e);
  return {
    x: toScene(lon0),
    y: toScene([0, 0, 1]),
    z: [-z[0], -z[1], -z[2]],
  };
}
