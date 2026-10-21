import { describe, expect, it } from "vitest";
import { GM_SUN } from "./constants";
import { createNBody, createParticle } from "./integrator";
import { orbitalPeriod, propagate, stateFromElements, type Elements } from "./kepler";
import { createStepper } from "./stepper";
import { length, sub } from "./vec";

describe("velocity verlet", () => {
  it("closes a circular orbit after one period", () => {
    const period = orbitalPeriod(1, GM_SUN);
    const v = Math.sqrt(GM_SUN);
    const p = createParticle([1, 0, 0], [0, v, 0], 0, [{ mu: GM_SUN, position: () => [0, 0, 0] }]);
    const steps = 20_000;
    for (let i = 0; i < steps; i++) p.step(period / steps);
    expect(length(sub(p.state.r, [1, 0, 0]))).toBeLessThan(1e-6);
    expect(length(p.state.r)).toBeCloseTo(1, 8);
  });

  it("keeps a two-body system's energy bounded over 100 orbits", () => {
    const v = Math.sqrt(GM_SUN);
    const sys = createNBody([
      { mu: GM_SUN, r: [0, 0, 0], v: [0, 0, 0] },
      { mu: 1e-9, r: [1, 0, 0], v: [0, v * 1.1, 0] },
    ]);
    const e0 = sys.energy();
    const dt = 1;
    let worst = 0;
    for (let i = 0; i < 365 * 100; i++) {
      sys.step(dt);
      worst = Math.max(worst, Math.abs((sys.energy() - e0) / e0));
    }
    expect(worst).toBeLessThan(1e-4);
  });

  it("matches analytic kepler propagation for an eccentric orbit", () => {
    const mars: Elements = {
      a: 1.5237,
      e: 0.0934,
      i: 0.0323,
      L: 0.3,
      varpi: 5.86,
      Omega: 0.865,
    };
    const s0 = stateFromElements(mars, GM_SUN);
    const p = createParticle(s0.r, s0.v, 0, [{ mu: GM_SUN, position: () => [0, 0, 0] }]);
    const days = 200;
    const dt = 0.05;
    for (let i = 0; i < days / dt; i++) p.step(dt);
    const expected = stateFromElements(propagate(mars, GM_SUN, days), GM_SUN);
    expect(length(sub(p.state.r, expected.r))).toBeLessThan(1e-6);
  });
});

describe("fixed stepper", () => {
  it("spends simulated time in whole fixed steps", () => {
    const s = createStepper(0.5, 100);
    let steps = 0;
    expect(s.advance(1.2, () => steps++)).toBe(1);
    expect(steps).toBe(2);
    expect(s.remainder).toBeCloseTo(0.2);
    s.advance(0.35, () => steps++);
    expect(steps).toBe(3);
  });

  it("drops time beyond the per frame step budget instead of queueing it", () => {
    const s = createStepper(1, 10);
    let steps = 0;
    expect(s.advance(1e6, () => steps++)).toBe(10);
    expect(steps).toBe(10);
    expect(s.remainder).toBe(0);
  });
});
