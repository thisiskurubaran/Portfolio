import { describe, expect, it } from "vitest";
import { earthBasis, eclipticToScene, fromEclipticLon, type Vec3 } from "./frames";
import { sunPosition } from "./sun";
import { daysSinceJ2000, gmst } from "./time";

const deg = (rad: number) => (rad * 180) / Math.PI;
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** Latitude and longitude (degrees) of the point on Earth with the Sun overhead. */
function subsolar(ms: number): { lat: number; lon: number } {
  const sun = eclipticToScene(fromEclipticLon(sunPosition(ms).lon));
  const b = earthBasis(gmst(ms), daysSinceJ2000(ms) / 36525);
  const lat = Math.asin(dot(sun, b.y));
  // Body frame: longitude 0 on +x, 90 E on -z.
  const lon = Math.atan2(-dot(sun, b.z), dot(sun, b.x));
  return { lat: deg(lat), lon: deg(lon) };
}

describe("earth orientation", () => {
  it("puts the Sun over the equator at the March 2026 equinox", () => {
    // Equinox: 2026-03-20 14:46 UTC.
    expect(Math.abs(subsolar(Date.UTC(2026, 2, 20, 14, 46)).lat)).toBeLessThan(0.1);
  });

  it("puts the Sun over the Tropic of Cancer at the June 2026 solstice", () => {
    // Solstice: 2026-06-21 08:24 UTC.
    expect(subsolar(Date.UTC(2026, 5, 21, 8, 24)).lat).toBeCloseTo(23.44, 1);
  });

  it("puts the noon Sun near Greenwich, offset by the equation of time", () => {
    // On 2026-11-03 the Sun runs about 16.4 minutes fast, so at 12:00 UTC it
    // has already passed Greenwich by about 4.1 degrees of longitude.
    expect(subsolar(Date.UTC(2026, 10, 3, 12)).lon).toBeCloseTo(-4.1, 0);
  });
});
