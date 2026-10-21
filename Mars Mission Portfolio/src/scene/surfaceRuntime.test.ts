import { describe, expect, it } from "vitest";
import { landingSites } from "@/content/landingSites";
import { nextMorning, sunElevationSin } from "./surfaceRuntime";

describe("landing time", () => {
  it("finds the site's next morning within a sol", () => {
    const from = Date.UTC(2027, 8, 8);
    for (const site of landingSites) {
      const t = nextMorning(site, from);
      expect(t).toBeGreaterThan(from);
      expect(t - from).toBeLessThan(1.05 * 88_775_244);
      // Five minute search steps: the Sun climbs about 1.2 degrees in each.
      expect(Math.abs(Math.asin(sunElevationSin(site, t)) * (180 / Math.PI) - 30)).toBeLessThan(1.5);
      // Morning: the Sun is still climbing.
      expect(sunElevationSin(site, t + 600_000)).toBeGreaterThan(sunElevationSin(site, t));
    }
  });
});
