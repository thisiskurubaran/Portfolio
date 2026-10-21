import { describe, expect, it } from "vitest";
import { enckeState, ENCKE_FACTS } from "./sightings";

describe("comet Encke", () => {
  it("is at perihelion, 0.34 AU from the Sun, in October 2023", () => {
    const r = enckeState(Date.UTC(2023, 9, 22, 17)).r;
    expect(Math.hypot(...r)).toBeCloseTo(ENCKE_FACTS.perihelionAu, 2);
    expect(ENCKE_FACTS.perihelionAu).toBeCloseTo(0.336, 2);
  });

  it("returns about every 3.3 years and is far out at aphelion between", () => {
    expect(ENCKE_FACTS.periodYears).toBeCloseTo(3.3, 1);
    const half = Date.UTC(2023, 9, 22) + (ENCKE_FACTS.periodYears / 2) * 365.25 * 86_400_000;
    expect(Math.hypot(...enckeState(half).r)).toBeGreaterThan(4);
  });
});
