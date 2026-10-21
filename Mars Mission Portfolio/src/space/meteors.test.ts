import { describe, expect, it } from "vitest";
import { activeShowers } from "./meteors";

describe("meteor showers", () => {
  it("has the Orionids at peak on 21 October", () => {
    const a = activeShowers(Date.UTC(2026, 9, 21, 6));
    expect(a[0]?.shower.id).toBe("ori");
    expect(a[0]?.atPeak).toBe(true);
    expect(a[0]?.rate).toBeGreaterThan(19);
  });

  it("handles showers across the new year", () => {
    expect(activeShowers(Date.UTC(2027, 0, 3)).map((s) => s.shower.id)).toContain("qua");
    expect(activeShowers(Date.UTC(2026, 11, 30)).map((s) => s.shower.id)).toContain("qua");
  });

  it("is quiet in early March", () => {
    expect(activeShowers(Date.UTC(2026, 2, 5))).toEqual([]);
  });
});
