import type { Vec3 } from "./vec";

/**
 * Velocity Verlet for gravitating point masses. It is symplectic, so energy
 * errors oscillate instead of drifting, which keeps long coasts at high time
 * warp from slowly spiralling in or out.
 *
 * Units are AU, days and GM in AU^3/day^2. State arrays are mutated in place
 * because this runs many times a frame.
 */
export type Body = {
  mu: number;
  r: Vec3;
  v: Vec3;
};

/** Close passes are softened by this distance (AU) so a direct hit cannot blow up the step. */
const SOFTENING2 = 1e-12;

function accelerations(bodies: Body[], out: Vec3[]): void {
  for (const a of out) a.fill(0);
  for (let i = 0; i < bodies.length; i++) {
    const bi = bodies[i]!;
    for (let j = i + 1; j < bodies.length; j++) {
      const bj = bodies[j]!;
      const dx = bj.r[0] - bi.r[0];
      const dy = bj.r[1] - bi.r[1];
      const dz = bj.r[2] - bi.r[2];
      const d2 = dx * dx + dy * dy + dz * dz + SOFTENING2;
      const inv3 = 1 / (d2 * Math.sqrt(d2));
      const ai = out[i]!;
      const aj = out[j]!;
      ai[0] += bj.mu * dx * inv3;
      ai[1] += bj.mu * dy * inv3;
      ai[2] += bj.mu * dz * inv3;
      aj[0] -= bi.mu * dx * inv3;
      aj[1] -= bi.mu * dy * inv3;
      aj[2] -= bi.mu * dz * inv3;
    }
  }
}

export function createNBody(bodies: Body[]) {
  const acc: Vec3[] = bodies.map(() => [0, 0, 0]);
  accelerations(bodies, acc);

  return {
    bodies,
    step(dt: number): void {
      const h = dt / 2;
      for (let i = 0; i < bodies.length; i++) {
        const b = bodies[i]!;
        const a = acc[i]!;
        for (let k = 0; k < 3; k++) {
          b.v[k]! += a[k]! * h;
          b.r[k]! += b.v[k]! * dt;
        }
      }
      accelerations(bodies, acc);
      for (let i = 0; i < bodies.length; i++) {
        const b = bodies[i]!;
        const a = acc[i]!;
        for (let k = 0; k < 3; k++) b.v[k]! += a[k]! * h;
      }
    },
    energy(): number {
      let e = 0;
      for (let i = 0; i < bodies.length; i++) {
        const bi = bodies[i]!;
        // Masses enter as mu/G; G cancels in comparisons of energy over time.
        e += 0.5 * bi.mu * (bi.v[0] ** 2 + bi.v[1] ** 2 + bi.v[2] ** 2);
        for (let j = i + 1; j < bodies.length; j++) {
          const bj = bodies[j]!;
          const d = Math.hypot(bj.r[0] - bi.r[0], bj.r[1] - bi.r[1], bj.r[2] - bi.r[2]);
          e -= (bi.mu * bj.mu) / d;
        }
      }
      return e;
    },
  };
}

/**
 * A massless particle (the ship) moving under attractors whose positions are
 * given as a function of time, such as planets on Kepler orbits. The ship
 * never pulls on the planets, so they stay on their analytic tracks.
 */
export type Attractor = { mu: number; position: (t: number) => Vec3 };

function particleAccel(r: Vec3, t: number, attractors: Attractor[], out: Vec3): void {
  out.fill(0);
  for (const at of attractors) {
    const p = at.position(t);
    const dx = p[0] - r[0];
    const dy = p[1] - r[1];
    const dz = p[2] - r[2];
    const d2 = dx * dx + dy * dy + dz * dz + SOFTENING2;
    const inv3 = 1 / (d2 * Math.sqrt(d2));
    out[0] += at.mu * dx * inv3;
    out[1] += at.mu * dy * inv3;
    out[2] += at.mu * dz * inv3;
  }
}

export function createParticle(r: Vec3, v: Vec3, t0: number, attractors: Attractor[]) {
  const state = { r: [...r] as Vec3, v: [...v] as Vec3, t: t0 };
  const acc: Vec3 = [0, 0, 0];
  particleAccel(state.r, state.t, attractors, acc);

  return {
    state,
    step(dt: number): void {
      const h = dt / 2;
      for (let k = 0; k < 3; k++) {
        state.v[k]! += acc[k]! * h;
        state.r[k]! += state.v[k]! * dt;
      }
      state.t += dt;
      particleAccel(state.r, state.t, attractors, acc);
      for (let k = 0; k < 3; k++) state.v[k]! += acc[k]! * h;
    },
    /** Instant velocity change, from a burn. */
    impulse(dv: Vec3): void {
      for (let k = 0; k < 3; k++) state.v[k]! += dv[k]!;
    },
  };
}
