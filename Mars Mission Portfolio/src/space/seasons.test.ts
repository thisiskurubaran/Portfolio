import { describe, expect, it } from "vitest";
import { sunPosition } from "./sun";
import { marsDustSeason, marsLs, marsYear, northernSeason } from "./seasons";

describe("seasons", () => {
  it("puts Mars year 37 northern spring equinox on 26 December 2022", () => {
    const ls = marsLs(Date.UTC(2022, 11, 26, 12));
    expect(Math.min(ls, 360 - ls)).toBeLessThan(0.6);
    expect(marsYear(Date.UTC(2022, 11, 27))).toBe(37);
  });

  it("matches the start of the 2018 global dust storm near Ls 185", () => {
    const ls = marsLs(Date.UTC(2018, 4, 30));
    expect(ls).toBeGreaterThan(183);
    expect(ls).toBeLessThan(188);
    expect(marsDustSeason(ls)).toBe(true);
  });

  it("names Earth's season from the Sun's longitude", () => {
    const lon = (sunPosition(Date.UTC(2026, 9, 21)).lon * 180) / Math.PI;
    expect(northernSeason(lon)).toBe("autumn");
  });
});
