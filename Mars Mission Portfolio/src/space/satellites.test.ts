import { describe, expect, it } from "vitest";
import { satPositionKm } from "./satellites";

const iss = {
  OBJECT_NAME: "ISS (ZARYA)",
  OBJECT_ID: "1998-067A",
  EPOCH: "2026-10-20T12:00:00",
  MEAN_MOTION: 15.5,
  ECCENTRICITY: 0.0005,
  INCLINATION: 51.64,
  RA_OF_ASC_NODE: 100,
  ARG_OF_PERICENTER: 90,
  MEAN_ANOMALY: 0,
};

describe("satellite propagation", () => {
  it("keeps the ISS near 420 km and inside its inclination", () => {
    for (let h = 0; h < 24; h += 1.7) {
      const [x, y, z] = satPositionKm(iss, Date.parse("2026-10-20T12:00:00Z") + h * 3_600_000);
      const r = Math.hypot(x, y, z);
      expect(r - 6378).toBeGreaterThan(380);
      expect(r - 6378).toBeLessThan(450);
      expect(Math.abs(Math.asin(z / r)) * (180 / Math.PI)).toBeLessThanOrEqual(51.7);
    }
  });

  it("regresses the node westward about 5 degrees a day at the ISS's inclination", () => {
    // The node is where the orbit plane meets the equator: from the angular momentum vector.
    const node = (t: number) => {
      const r = satPositionKm(iss, t);
      const q = satPositionKm(iss, t + 1000);
      const h = [r[1] * q[2] - r[2] * q[1], r[2] * q[0] - r[0] * q[2], r[0] * q[1] - r[1] * q[0]];
      return (Math.atan2(h[0]!, -h[1]!) * 180) / Math.PI;
    };
    const t0 = Date.parse("2026-10-20T12:00:00Z");
    const drift = node(t0 + 86_400_000) - node(t0);
    expect(drift).toBeLessThan(-4.5);
    expect(drift).toBeGreaterThan(-5.5);
  });
});
