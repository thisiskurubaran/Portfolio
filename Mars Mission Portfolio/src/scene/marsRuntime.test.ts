import { describe, expect, it } from "vitest";
import { Vector3 } from "three";
import { propagate, stateFromElements } from "@/physics/kepler";
import { PROPELLANT_KG } from "@/physics/ship";
import { dot, length, sub } from "@/physics/vec";
import { elementsAt } from "@/space/elements";
import { GM_MARS_KM, MARS_MOONS, MARS_RADIUS_KM, marsAxes } from "@/space/mars";
import { hohmannToMoon, mars, moonPositionKm, planCapture } from "./marsRuntime";
import { beginTransfer, planTransfer, transit } from "./transitRuntime";

describe("mars orientation", () => {
  it("tilts the pole about 25.2 degrees from the orbit normal", () => {
    const ms = Date.UTC(2027, 8, 1);
    const pole = marsAxes(ms).pole;
    const el = elementsAt("mars", ms);
    const n = [Math.sin(el.i) * Math.sin(el.Omega), -Math.sin(el.i) * Math.cos(el.Omega), Math.cos(el.i)];
    const deg = (Math.acos(pole[0] * n[0]! + pole[1] * n[1]! + pole[2] * n[2]!) * 180) / Math.PI;
    expect(deg).toBeCloseTo(25.2, 0);
  });
});

describe("capture at Mars on the late 2026 transfer", () => {
  transit.propellantKg = PROPELLANT_KG;
  const plan = planTransfer(Date.UTC(2026, 9, 21))!;
  beginTransfer(new Vector3(6571, 0, 0));
  planCapture(plan);

  it("puts apoapsis on Mars's equator at Phobos's radius", () => {
    const apo = stateFromElements(propagate(mars.capture!, GM_MARS_KM, (mars.apoMs - mars.periMs) / 1000), GM_MARS_KM);
    expect(length(apo.r)).toBeCloseTo(MARS_MOONS.phobos.radiusKm, 0);
    expect(Math.abs(dot(apo.r, mars.pole)) / length(apo.r)).toBeLessThan(0.01);
  });

  it("dips to the aerocapture altitude and sheds speed there", () => {
    const peri = stateFromElements(mars.capture!, GM_MARS_KM);
    expect(length(peri.r) - MARS_RADIUS_KM).toBeCloseTo(45, 0);
    expect(mars.aerocaptureDv).toBeGreaterThan(0.5);
    expect(mars.aerocaptureDv).toBeLessThan(3);
  });

  it("needs an insertion burn the ship can afford", () => {
    expect(mars.insertionDv).toBeGreaterThan(0.5);
    expect(mars.insertionDv).toBeLessThan(2);
  });

  it("has Phobos waiting just ahead of the ship after the burn", () => {
    const apo = stateFromElements(propagate(mars.capture!, GM_MARS_KM, (mars.apoMs - mars.periMs) / 1000), GM_MARS_KM);
    const gap = length(sub(moonPositionKm("phobos", mars.apoMs), apo.r));
    expect(gap).toBeGreaterThan(20);
    expect(gap).toBeLessThan(400);
  });

  it("gives textbook Hohmann numbers from Phobos to Deimos", () => {
    const h = hohmannToMoon("deimos");
    expect(h.dv1).toBeCloseTo(0.418, 2);
    expect(h.dv2).toBeCloseTo(0.33, 2);
    // Half the period of an orbit with a = 16,420 km: 8.87 hours.
    expect(h.hours).toBeCloseTo(8.87, 1);
  });
});
