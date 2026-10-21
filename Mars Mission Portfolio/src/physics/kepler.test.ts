import { describe, expect, it } from "vitest";
import { elementsFromState, orbitalPeriod, propagate, stateFromElements } from "./kepler";
import { length, sub, type Vec3 } from "./vec";

const MU_EARTH_KM = 398_600.4418;

describe("elements from state", () => {
  const cases: { name: string; r: Vec3; v: Vec3 }[] = [
    { name: "inclined ellipse", r: [7000, 1200, -900], v: [-1.1, 7.2, 1.9] },
    { name: "circular", r: [6671, 0, 0], v: [0, Math.sqrt(MU_EARTH_KM / 6671) * 0.97, Math.sqrt(MU_EARTH_KM / 6671) * 0.2431] },
    { name: "equatorial", r: [0, 7000, 0], v: [-7.9, 0, 0] },
    { name: "retrograde tilt", r: [-5000, 4000, 2000], v: [3.5, 4.5, -4.8] },
  ];

  for (const c of cases) {
    it(`round trips a ${c.name} orbit`, () => {
      const el = elementsFromState(c.r, c.v, MU_EARTH_KM);
      const back = stateFromElements(el, MU_EARTH_KM);
      expect(length(sub(back.r, c.r))).toBeLessThan(1e-6);
      expect(length(sub(back.v, c.v))).toBeLessThan(1e-9);
    });
  }

  it("gives the textbook period for a 300 km circular orbit", () => {
    const r = 6371 + 300;
    const el = elementsFromState([r, 0, 0], [0, Math.sqrt(MU_EARTH_KM / r), 0], MU_EARTH_KM);
    expect(el.e).toBeLessThan(1e-12);
    expect(orbitalPeriod(el.a, MU_EARTH_KM) / 60).toBeCloseTo(90.4, 1);
  });

  it("returns to the start after one period", () => {
    const r: Vec3 = [7000, 1200, -900];
    const el = elementsFromState(r, [-1.1, 7.2, 1.9], MU_EARTH_KM);
    const after = stateFromElements(propagate(el, MU_EARTH_KM, orbitalPeriod(el.a, MU_EARTH_KM)), MU_EARTH_KM);
    expect(length(sub(after.r, r))).toBeLessThan(1e-6);
  });
});
