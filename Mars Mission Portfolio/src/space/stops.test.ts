import { describe, expect, it } from "vitest";
import { flyby } from "@/physics/flyby";
import { hillRadius } from "@/physics/lagrange";
import { AU_KM } from "@/physics/constants";
import { heliocentric } from "./elements";
import { GM_MOON_KM, moonGeocentric } from "./moon";

describe("moon", () => {
  it("lines up with the Sun at the total eclipse of 2024-04-08", () => {
    // Geocentric conjunction near 18:21 UTC.
    const ms = Date.UTC(2024, 3, 8, 18, 21);
    const [mx, my] = moonGeocentric(ms);
    const [ex, ey] = heliocentric("earth", ms).r;
    const moonLon = Math.atan2(my, mx);
    const sunLon = Math.atan2(-ey, -ex);
    const diff = Math.abs(((((moonLon - sunLon) * 180) / Math.PI + 540) % 360) - 180);
    expect(diff).toBeLessThan(0.5);
  });

  it("was near perigee then, about 360,000 km away", () => {
    const d = Math.hypot(...moonGeocentric(Date.UTC(2024, 3, 8, 18, 21)));
    expect(d).toBeGreaterThan(355_000);
    expect(d).toBeLessThan(365_000);
  });
});

describe("lagrange points", () => {
  it("puts Sun-Earth L2 about 1.5 million km out", () => {
    const gmEarthMoon = 398_600.4418 + 4_902.8;
    const r = hillRadius(AU_KM, gmEarthMoon, 1.32712440018e11);
    expect(r / 1e6).toBeCloseTo(1.5, 1);
  });
});

describe("flyby", () => {
  it("bends slow approaches more than fast ones", () => {
    const slow = flyby(0.5, 1837, GM_MOON_KM);
    const fast = flyby(3, 1837, GM_MOON_KM);
    expect(slow.turn).toBeGreaterThan(fast.turn);
  });

  it("matches the closed form for a known case", () => {
    // e = 1 + 1837 * 1 / 4902.8 = 1.3747; turn = 2 asin(1 / e) = 93.33 degrees.
    const f = flyby(1, 1837, GM_MOON_KM);
    expect(f.eccentricity).toBeCloseTo(1.3747, 3);
    expect((f.turn * 180) / Math.PI).toBeCloseTo(93.33, 1);
    expect(f.deltaV).toBeCloseTo(2 * Math.sin(f.turn / 2), 9);
  });
});
