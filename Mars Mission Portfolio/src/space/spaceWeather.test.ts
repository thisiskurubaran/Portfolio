import { describe, expect, it } from "vitest";
import { auroraEdgeDeg, flareFlux, gScale, rScale, sScale } from "./spaceWeather";

describe("space weather scales", () => {
  it("maps Kp, protons and flares onto the NOAA scales", () => {
    expect(gScale(4.67)).toBe(0);
    expect(gScale(5)).toBe(1);
    expect(gScale(9)).toBe(5);
    expect(sScale(9)).toBe(0);
    expect(sScale(12)).toBe(1);
    expect(sScale(1500)).toBe(3);
    expect(rScale("C9.9")).toBe(0);
    expect(rScale("M1.0")).toBe(1);
    expect(rScale("M5.2")).toBe(2);
    expect(rScale("X1.1")).toBe(3);
    expect(flareFlux("X1.0")).toBeGreaterThan(flareFlux("M9.9"));
    expect(auroraEdgeDeg(9)).toBeLessThan(auroraEdgeDeg(0));
  });
});
