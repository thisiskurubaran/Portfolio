import { describe, expect, it } from "vitest";
import { Vector3 } from "three";
import { PROPELLANT_KG } from "@/physics/ship";
import { beginTransfer, forceStop, planTransfer, transit } from "./transitRuntime";

const DAY = 86_400_000;

describe("stops on the late 2026 departure", () => {
  transit.propellantKg = PROPELLANT_KG;
  const plan = planTransfer(Date.UTC(2026, 9, 21))!;
  beginTransfer(new Vector3(6571, 0, 0));

  it("passes the Moon about a day and a half out, close to the escape path", () => {
    const moon = transit.stopStatus.moon;
    expect(moon.available).toBe(true);
    expect(moon.angleDeg!).toBeLessThan(40);
    expect((moon.tMs! - plan.departMs) / DAY).toBeGreaterThan(1);
    expect((moon.tMs! - plan.departMs) / DAY).toBeLessThan(2.5);
  });

  it("does not head toward L2, which lies away from the Sun", () => {
    expect(transit.stopStatus.l2.available).toBe(false);
  });

  it("moves the first steps content to the Moon", () => {
    const ids = transit.visits.map((v) => v.id);
    expect(ids[0]).toBe("moon");
    expect(ids).not.toContain("education");
    expect(ids).not.toContain("early");
  });

  it("adds L2 in time order when overridden", () => {
    forceStop("l2");
    const ids = transit.visits.map((v) => v.id);
    expect(ids.slice(0, 2)).toEqual(["moon", "l2"]);
    for (let i = 1; i < transit.visits.length; i++) {
      expect(transit.visits[i]!.tMs).toBeGreaterThanOrEqual(transit.visits[i - 1]!.tMs);
    }
  });
});
