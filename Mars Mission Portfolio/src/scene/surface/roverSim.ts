import type RAPIER_NS from "@dimforge/rapier3d-compat";
import { createStepper } from "@/physics/stepper";
import { TERRAIN_CELLS, TERRAIN_SIZE_M, type Terrain, sampleHeights } from "./terrain";

type Rapier = typeof RAPIER_NS;

/** Surface gravity of Mars, m/s^2. */
export const MARS_G = 3.72;
const FIXED_DT = 1 / 120;

/**
 * A six wheel pressurised crew rover, in the size class NASA has studied
 * for crewed Mars surface missions: 4.5 m long, 3 t, wheels on long travel
 * suspension, a few m/s at most. Rocker-bogie linkages are stood in for by
 * independent raycast suspension on each wheel.
 */
export const ROVER = {
  massKg: 3000,
  half: { x: 2.25, y: 0.7, z: 1.4 },
  wheelRadius: 0.55,
  /** Wheel stations along the body (x) and across it (z). */
  wheelX: [1.7, 0, -1.7],
  wheelZ: 1.55,
  suspensionRest: 0.55,
  maxEngineForce: 4500,
  /** Top speed, m/s: about 14 km/h, quick for Mars and still safe over rocks. */
  maxSpeed: 4,
  maxReverse: 2,
  maxBrake: 60,
  maxSteer: 0.5,
};

export type DriveInput = { throttle: number; steer: number; brake: boolean };

export function heightfieldDesc(R: Rapier, heights: Float32Array) {
  return R.ColliderDesc.heightfield(TERRAIN_CELLS, TERRAIN_CELLS, heights, {
    x: TERRAIN_SIZE_M,
    y: 1,
    z: TERRAIN_SIZE_M,
  }).setFriction(0.8);
}

export type RoverSim = Awaited<ReturnType<typeof createRoverSim>>;

/** Physics world for the surface: terrain, boulders and the rover, stepped at a fixed rate. */
export async function createRoverSim(terrain: Terrain, start: { x: number; z: number }) {
  const R = (await import("@dimforge/rapier3d-compat")).default;
  await R.init();
  const world = new R.World({ x: 0, y: -MARS_G, z: 0 });
  // Rapier steps by its own timestep; it must match the fixed step the stepper hands out.
  world.timestep = FIXED_DT;
  world.createCollider(heightfieldDesc(R, sampleHeights(terrain)));
  // Large rocks are obstacles; small ones are left to the suspension.
  for (const r of terrain.rocks) {
    if (r.size < 0.6) continue;
    world.createCollider(
      R.ColliderDesc.ball(r.size * 0.6).setTranslation(r.x, terrain.height(r.x, r.z) + r.size * 0.2, r.z),
    );
  }

  const y0 = terrain.height(start.x, start.z) + 2;
  const body = world.createRigidBody(
    R.RigidBodyDesc.dynamic()
      .setTranslation(start.x, y0, start.z)
      .setLinearDamping(0.05)
      .setAngularDamping(0.4)
      // A sleeping chassis stops the vehicle controller from updating its wheels.
      .setCanSleep(false),
  );
  const { x, y, z } = ROVER.half;
  const volume = 8 * x * y * z;
  world.createCollider(R.ColliderDesc.cuboid(x, y, z).setDensity(ROVER.massKg / volume).setFriction(0.5), body);

  const vehicle = world.createVehicleController(body);
  vehicle.indexUpAxis = 1;
  // Rapier names this setter setIndexForwardAxis; there is no plain indexForwardAxis setter.
  vehicle.setIndexForwardAxis = 0;
  for (const wx of ROVER.wheelX) {
    for (const side of [-1, 1]) {
      vehicle.addWheel(
        { x: wx, y: -y * 0.6, z: side * ROVER.wheelZ },
        { x: 0, y: -1, z: 0 },
        // Axle along +z makes positive engine force drive toward +x, the rover's nose.
        { x: 0, y: 0, z: 1 },
        ROVER.suspensionRest,
        ROVER.wheelRadius,
      );
    }
  }
  const wheels = ROVER.wheelX.length * 2;
  for (let i = 0; i < wheels; i++) {
    vehicle.setWheelSuspensionStiffness(i, 18);
    vehicle.setWheelMaxSuspensionTravel(i, 0.45);
    vehicle.setWheelSuspensionCompression(i, 2.4);
    vehicle.setWheelSuspensionRelaxation(i, 2.8);
    vehicle.setWheelMaxSuspensionForce(i, 20_000);
    // Loose regolith grips less than packed ground.
    vehicle.setWheelFrictionSlip(i, 1.2);
    vehicle.setWheelSideFrictionStiffness(i, 0.9);
  }

  // Up to a quarter second per frame, so slow devices still drive in real time.
  const stepper = createStepper(FIXED_DT, 30);
  return {
    body,
    vehicle,
    wheels,
    /** Advances the world by real elapsed time in fixed substeps. */
    advance(dt: number, input: DriveInput) {
      stepper.advance(Math.min(dt, 0.25), (h) => {
        // Hold top speed by cutting drive, the way a governor would.
        const speed = vehicle.currentVehicleSpeed();
        const limit = input.throttle < 0 ? ROVER.maxReverse : ROVER.maxSpeed;
        const drive = Math.abs(speed) > limit && Math.sign(speed) === Math.sign(input.throttle) ? 0 : input.throttle;
        // Asking for the other direction while still rolling brakes first, as a driver would.
        const opposing = input.throttle !== 0 && Math.abs(speed) > 0.3 && Math.sign(speed) !== Math.sign(input.throttle);
        for (let i = 0; i < wheels; i++) {
          const front = i < 2;
          const rear = i >= wheels - 2;
          // Front and rear pairs steer in opposite senses, as on skid steer rovers with
          // corner steering: tighter turns than front steering alone.
          vehicle.setWheelSteering(i, front ? input.steer * ROVER.maxSteer : rear ? -input.steer * ROVER.maxSteer * 0.7 : 0);
          vehicle.setWheelEngineForce(i, opposing ? 0 : drive * (ROVER.maxEngineForce / wheels));
          // Light drag brake when coasting, and the governor brakes on downhill runs.
          const over = Math.abs(speed) > limit * 1.05;
          vehicle.setWheelBrake(i, input.brake ? ROVER.maxBrake : opposing ? 30 : over ? 20 : input.throttle === 0 ? 4 : 0);
        }
        vehicle.updateVehicle(h);
        world.step();
      });
    },
    /** Puts the rover back on its wheels where it is. */
    rightUp() {
      const t = body.translation();
      body.setTranslation({ x: t.x, y: terrain.height(t.x, t.z) + 2, z: t.z }, true);
      body.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    },
    dispose() {
      world.free();
    },
  };
}
