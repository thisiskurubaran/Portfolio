import { describe, expect, it } from "vitest";
import { hyperbolaState, periapsisSpeed } from "./hyperbola";

const MU_MARS = 42_828.37;

describe("hyperbolic approach", () => {
  const h = { rp: 3389.5 + 45, vInf: 2.6, mu: MU_MARS };

  it("sits at periapsis at t = 0 with the periapsis speed", () => {
    const s = hyperbolaState(h, 0);
    expect(s.r[0]).toBeCloseTo(h.rp, 6);
    expect(s.r[1]).toBeCloseTo(0, 6);
    expect(Math.hypot(...s.v)).toBeCloseTo(periapsisSpeed(h), 9);
  });

  it("conserves energy and angular momentum along the path", () => {
    const energy = (t: number) => {
      const s = hyperbolaState(h, t);
      return Math.hypot(...s.v) ** 2 / 2 - MU_MARS / Math.hypot(...s.r);
    };
    const angular = (t: number) => {
      const s = hyperbolaState(h, t);
      return s.r[0] * s.v[1] - s.r[1] * s.v[0];
    };
    for (const t of [-200_000, -3600, -60, 60, 3600]) {
      expect(energy(t)).toBeCloseTo(h.vInf ** 2 / 2, 6);
      expect(angular(t)).toBeCloseTo(angular(0), 4);
    }
  });

  it("approaches from negative y before periapsis", () => {
    expect(hyperbolaState(h, -3600).r[1]).toBeLessThan(0);
    expect(hyperbolaState(h, 3600).r[1]).toBeGreaterThan(0);
  });
});
