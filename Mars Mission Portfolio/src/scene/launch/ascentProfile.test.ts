import { describe, expect, it } from "vitest";
import { EVENTS, INSERTION_ALTITUDE_KM, sampleAscent } from "./ascentProfile";

const MU_EARTH_KM = 398_600.4418;
const EARTH_RADIUS_KM = 6371;

describe("ascent profile", () => {
  it("climbs without ever losing altitude", () => {
    let prev = -1;
    for (let t = 0; t <= EVENTS.seco; t += 0.5) {
      const h = sampleAscent(t).altitudeKm;
      expect(h).toBeGreaterThanOrEqual(prev);
      prev = h;
    }
  });

  it("reaches circular orbit speed at SECO", () => {
    const s = sampleAscent(EVENTS.seco);
    const circular = Math.sqrt(MU_EARTH_KM / (EARTH_RADIUS_KM + INSERTION_ALTITUDE_KM));
    expect(s.altitudeKm).toBeCloseTo(INSERTION_ALTITUDE_KM, 6);
    expect(Math.abs(s.speedKmS / circular - 1)).toBeLessThan(0.001);
    expect(s.pitch).toBeCloseTo(0, 6);
  });

  it("keeps the engines off between MECO and second stage ignition", () => {
    expect(sampleAscent(EVENTS.meco - 1).thrust).toBe(true);
    expect(sampleAscent(EVENTS.stageSeparation).thrust).toBe(false);
    expect(sampleAscent(EVENTS.secondStageIgnition + 1).thrust).toBe(true);
    expect(sampleAscent(EVENTS.seco + 1).thrust).toBe(false);
  });
});
