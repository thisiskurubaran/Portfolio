import { describe as group, expect, it } from "vitest";
import { describe, isGo, nextClearSlot, violations } from "./launchRules";

group("launch weather rules", () => {
  it("holds for lightning, wind and heavy rain", () => {
    expect(violations({ code: 95, gusts: 20 })).toEqual(["lightning"]);
    expect(violations({ code: 3, gusts: 70 })).toEqual(["wind"]);
    expect(violations({ code: 65, gusts: 10 })).toEqual(["rain"]);
    expect(violations({ code: 2, gusts: 30 })).toEqual([]);
    expect(isGo(null)).toBe(true);
  });

  it("finds the first clear hour in the forecast", () => {
    const t0 = Date.UTC(2026, 9, 21, 12);
    const h = 3_600_000;
    const f = [
      { t: t0, code: 95, gusts: 40, cloudCover: 1 },
      { t: t0 + h, code: 95, gusts: 40, cloudCover: 1 },
      { t: t0 + 2 * h, code: 3, gusts: 60, cloudCover: 1 },
      { t: t0 + 3 * h, code: 2, gusts: 30, cloudCover: 0.4 },
    ];
    expect(nextClearSlot(f, t0 + 600_000)).toBe(t0 + 3 * h);
    expect(nextClearSlot(f.slice(0, 3), t0)).toBeNull();
    expect(describe(96)).toBe("Thunderstorm");
  });
});
