import { describe, expect, it } from "vitest";
import RAPIER from "@dimforge/rapier3d-compat";
import { makeTerrain, sampleHeights, TERRAIN_CELLS, TERRAIN_SIZE_M } from "./terrain";
import { heightfieldDesc } from "./roverSim";

describe("terrain collider", () => {
  it("matches the terrain height function", async () => {
    await RAPIER.init();
    const world = new RAPIER.World({ x: 0, y: -3.72, z: 0 });
    const t = makeTerrain("jezero");
    world.createCollider(heightfieldDesc(RAPIER, sampleHeights(t)));
    world.step();
    const step = TERRAIN_SIZE_M / TERRAIN_CELLS;
    // Points off the grid lines, where the collider and the function must agree
    // to within the linear interpolation across one cell.
    for (const [x, z] of [
      [0.3 * step, 0.4 * step],
      [12.5 * step, -30.25 * step],
      [-50.5 * step, 41.5 * step],
      [70.2 * step, 69.7 * step],
    ]) {
      const ray = new RAPIER.Ray({ x: x!, y: 500, z: z! }, { x: 0, y: -1, z: 0 });
      const hit = world.castRay(ray, 1000, true);
      expect(hit).not.toBeNull();
      expect(Math.abs(500 - hit!.timeOfImpact - t.height(x!, z!))).toBeLessThan(0.15);
    }
  });
});

describe("rover", () => {
  it("settles on its wheels and drives forward under Mars gravity", async () => {
    const { createRoverSim } = await import("./roverSim");
    const sim = await createRoverSim(makeTerrain("jezero"), { x: 0, z: 0 });
    const input = { throttle: 0, steer: 0, brake: false };
    for (let i = 0; i < 360; i++) sim.advance(1 / 60, input);
    const settled = sim.body.translation();
    expect(Math.hypot(sim.body.linvel().x, sim.body.linvel().y, sim.body.linvel().z)).toBeLessThan(0.2);
    let contacts = 0;
    for (let i = 0; i < sim.wheels; i++) if (sim.vehicle.wheelIsInContact(i)) contacts++;
    // A rigid chassis on three axles rests on whichever four or six wheels touch first;
    // real rocker-bogie linkages share the load, independent suspension does not always.
    expect(contacts).toBeGreaterThanOrEqual(4);

    input.throttle = 1;
    for (let i = 0; i < 600; i++) sim.advance(1 / 60, input);
    const moved = sim.body.translation();
    expect(sim.vehicle.currentVehicleSpeed()).toBeGreaterThan(1);
    expect(sim.vehicle.currentVehicleSpeed()).toBeLessThan(4.5);
    expect(moved.x - settled.x).toBeGreaterThan(5);
    sim.dispose();
  });
});
