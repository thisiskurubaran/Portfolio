import { describe, expect, it } from "vitest";
import { distanceKm, nearbyQuake, type Hazards } from "./hazards";

const now = Date.parse("2026-10-21T12:00:00Z");
const quake = (over: Partial<Hazards["quakes"][number]>) => ({
  id: "q1",
  name: "Off the coast",
  magnitude: 7.1,
  lat: 13,
  lon: 81,
  alert: "Orange" as const,
  at: "2026-10-21T06:00:00Z",
  url: "https://www.gdacs.org/report.aspx?eventid=1",
  ...over,
});

describe("hazard advisories", () => {
  it("measures great circle distances", () => {
    // Chennai to Bengaluru is about 290 km.
    expect(distanceKm(13.08, 80.27, 12.97, 77.59)).toBeGreaterThan(280);
    expect(distanceKm(13.08, 80.27, 12.97, 77.59)).toBeLessThan(300);
  });

  it("reports only strong, recent, nearby quakes above a green alert", () => {
    const h = (q: ReturnType<typeof quake>): Hazards => ({ storms: [], quakes: [q] });
    expect(nearbyQuake(h(quake({})), 13.1, 80.3, now)?.km).toBeLessThan(200);
    expect(nearbyQuake(h(quake({ alert: "Green" })), 13.1, 80.3, now)).toBeNull();
    expect(nearbyQuake(h(quake({ magnitude: 5.9 })), 13.1, 80.3, now)).toBeNull();
    expect(nearbyQuake(h(quake({ lat: 40, lon: 140 })), 13.1, 80.3, now)).toBeNull();
    expect(nearbyQuake(h(quake({ at: "2026-10-18T06:00:00Z" })), 13.1, 80.3, now)).toBeNull();
    expect(nearbyQuake(h(quake({})), null, null, now)).toBeNull();
  });
});
