import { describe, expect, it } from "vitest";
import { AU_KM, DAY_S } from "./constants";
import { lambert } from "./lambert";
import { deltaV, propellantFor } from "./rocketEquation";
import { nextWindow, type Ephemeris } from "./transfer";
import { heliocentric } from "@/space/elements";

const toKm =
  (id: "earth" | "mars"): Ephemeris =>
  (ms) => {
    const s = heliocentric(id, ms);
    return {
      r: [s.r[0] * AU_KM, s.r[1] * AU_KM, s.r[2] * AU_KM],
      v: [(s.v[0] * AU_KM) / DAY_S, (s.v[1] * AU_KM) / DAY_S, (s.v[2] * AU_KM) / DAY_S],
    };
  };

describe("lambert", () => {
  it("matches Curtis example 5.2", () => {
    const sol = lambert([5000, 10000, 2100], [-14600, 2500, 7000], 3600, 398_600)!;
    expect(sol.v1[0]).toBeCloseTo(-5.9925, 3);
    expect(sol.v1[1]).toBeCloseTo(1.9254, 3);
    expect(sol.v1[2]).toBeCloseTo(3.2456, 3);
    expect(sol.v2[0]).toBeCloseTo(-3.3125, 3);
    expect(sol.v2[1]).toBeCloseTo(-4.1966, 3);
    expect(sol.v2[2]).toBeCloseTo(-0.38529, 3);
  });
});

describe("launch windows", () => {
  const parking = 6371 + 200;

  it("finds the 2020 window that Perseverance and Tianwen-1 used", () => {
    const w = nextWindow(Date.UTC(2020, 3, 1), toKm("earth"), toKm("mars"), parking, 300)!;
    const depart = new Date(w.departMs);
    expect(depart.getTime()).toBeGreaterThan(Date.UTC(2020, 5, 1));
    expect(depart.getTime()).toBeLessThan(Date.UTC(2020, 8, 15));
    const c3 = w.vInfDepart ** 2;
    expect(c3).toBeGreaterThan(8);
    expect(c3).toBeLessThan(20);
  });

  it("finds the late 2026 window", () => {
    const w = nextWindow(Date.UTC(2026, 5, 1), toKm("earth"), toKm("mars"), parking, 400)!;
    expect(w.departMs).toBeGreaterThan(Date.UTC(2026, 8, 1));
    expect(w.departMs).toBeLessThan(Date.UTC(2027, 1, 1));
    expect(w.departBurn).toBeGreaterThan(3.4);
    expect(w.departBurn).toBeLessThan(4.2);
  });
});

describe("rocket equation", () => {
  it("is consistent between delta-v and propellant", () => {
    const wet = 70_000;
    const dv = 3.6;
    const prop = propellantFor(dv, wet, 450);
    expect(deltaV(wet, wet - prop, 450)).toBeCloseTo(dv, 9);
  });
});
