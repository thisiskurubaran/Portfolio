import { describe, expect, it } from "vitest";
import { GM_SUN } from "@/physics/constants";
import { orbitalPeriod } from "@/physics/kepler";
import { lightTimeSeconds } from "@/physics/lightTimeDelay";
import { elementsAt, heliocentric } from "./elements";
import { daysSinceJ2000, toRad } from "./time";

const deg = (rad: number) => (rad * 180) / Math.PI;

function angleDiffDeg(a: number, b: number): number {
  const d = (((deg(a - b) % 360) + 540) % 360) - 180;
  return Math.abs(d);
}

describe("planet elements", () => {
  it("gives known sidereal periods through Kepler's third law", () => {
    const now = Date.UTC(2026, 0, 1);
    expect(orbitalPeriod(elementsAt("earth", now).a, GM_SUN)).toBeCloseTo(365.256, 1);
    expect(orbitalPeriod(elementsAt("mars", now).a, GM_SUN)).toBeCloseTo(686.98, 0);
    expect(orbitalPeriod(elementsAt("jupiter", now).a, GM_SUN) / 365.25).toBeCloseTo(11.86, 1);
  });

  it("agrees with the Astronomical Almanac Sun formula", () => {
    for (const ms of [Date.UTC(2020, 2, 20), Date.UTC(2025, 6, 4), Date.UTC(2026, 9, 21)]) {
      // Independent check: the Almanac's low precision Sun longitude, which
      // is referred to the equinox of date, moved back to J2000 by removing
      // general precession (1.397 degrees per century).
      const n = daysSinceJ2000(ms);
      const L = toRad(280.46 + 0.9856474 * n);
      const g = toRad(357.528 + 0.9856003 * n);
      const almanac =
        L + toRad(1.915) * Math.sin(g) + toRad(0.02) * Math.sin(2 * g) - toRad((1.397 * n) / 36525);
      const [x, y] = heliocentric("earth", ms).r;
      expect(angleDiffDeg(Math.atan2(-y, -x), almanac)).toBeLessThan(0.02);
    }
  });

  it("places Mars at opposition on 2025-01-16", () => {
    const ms = Date.UTC(2025, 0, 16, 2, 38);
    const [ex, ey] = heliocentric("earth", ms).r;
    const [mx, my] = heliocentric("mars", ms).r;
    expect(angleDiffDeg(Math.atan2(ey, ex), Math.atan2(my, mx))).toBeLessThan(0.5);
  });

  it("keeps Earth near 1 AU and moving at about 29.8 km/s", () => {
    const s = heliocentric("earth", Date.UTC(2026, 0, 1));
    const r = Math.hypot(...s.r);
    const vKmS = (Math.hypot(...s.v) * 149_597_870.7) / 86_400;
    expect(r).toBeGreaterThan(0.983);
    expect(r).toBeLessThan(1.017);
    expect(vKmS).toBeCloseTo(29.8, 0);
  });
});

describe("light time", () => {
  it("takes about 499 seconds to cross 1 AU", () => {
    expect(lightTimeSeconds(1)).toBeCloseTo(499.0, 0);
  });
});
