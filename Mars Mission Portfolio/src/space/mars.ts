import type { Vec3 } from "@/physics/vec";
import { equatorialToEcliptic } from "./frames";
import { daysSinceJ2000, toRad } from "./time";

export const MARS_RADIUS_KM = 3389.5;
export const GM_MARS_KM = 42_828.37;

/**
 * Mars orientation from the IAU WGCCRE 2009 report: north pole right
 * ascension and declination, and the prime meridian angle W, all in the
 * ICRF (J2000 equatorial) frame.
 */
function orientation(ms: number) {
  const d = daysSinceJ2000(ms);
  const T = d / 36525;
  return {
    ra: toRad(317.68143 - 0.1061 * T),
    dec: toRad(52.8865 - 0.0609 * T),
    W: toRad((((176.63 + 350.89198226 * d) % 360) + 360) % 360),
  };
}

/**
 * Body frame axes in J2000 ecliptic coordinates (not yet mapped to scene
 * axes): pole, the prime meridian on the equator, and 90 degrees east.
 * The equator crosses the ICRF equator at right ascension ra + 90 degrees,
 * and W is measured east along the body equator from there.
 */
export function marsAxes(ms: number): { pole: Vec3; lon0: Vec3; lon90e: Vec3 } {
  const { ra, dec, W } = orientation(ms);
  const pole: Vec3 = [Math.cos(dec) * Math.cos(ra), Math.cos(dec) * Math.sin(ra), Math.sin(dec)];
  const node: Vec3 = [Math.cos(ra + Math.PI / 2), Math.sin(ra + Math.PI / 2), 0];
  const q: Vec3 = [
    pole[1] * node[2] - pole[2] * node[1],
    pole[2] * node[0] - pole[0] * node[2],
    pole[0] * node[1] - pole[1] * node[0],
  ];
  const along = (a: number): Vec3 => [
    Math.cos(a) * node[0] + Math.sin(a) * q[0],
    Math.cos(a) * node[1] + Math.sin(a) * q[1],
    Math.cos(a) * node[2] + Math.sin(a) * q[2],
  ];
  return {
    pole: equatorialToEcliptic(pole),
    lon0: equatorialToEcliptic(along(W)),
    lon90e: equatorialToEcliptic(along(W + Math.PI / 2)),
  };
}

/**
 * The moons, on circular orbits in Mars's equatorial plane at their real
 * radii and periods. Their true orbits are nearly circular (e 0.015 and
 * 0.0003) and within 2 degrees of the equator. Where each moon is along
 * its orbit is set by the mission, so a rendezvous lines up, not taken
 * from an ephemeris.
 */
export const MARS_MOONS = {
  phobos: { name: "Phobos", radiusKm: 9_376, periodH: 7.6539, sizeKm: [13.0, 11.4, 9.1] as Vec3 },
  deimos: { name: "Deimos", radiusKm: 23_463.2, periodH: 30.312, sizeKm: [7.8, 6.0, 5.1] as Vec3 },
} as const;

export type MarsMoon = keyof typeof MARS_MOONS;
