/**
 * Fixed timestep driver, decoupled from the render rate. Each frame adds the
 * simulated time that passed (wall time times warp) to an accumulator and
 * spends it in whole steps of a fixed size, so the integrator sees the same
 * step at 1x and at 100,000x.
 *
 * When warp asks for more steps than a frame can afford, the excess is
 * dropped rather than carried over: the simulation slows down instead of
 * falling ever further behind and locking up the tab.
 */
export type Stepper = {
  /** Returns how much simulated time was actually stepped this frame. */
  advance(simDelta: number, step: (dt: number) => void): number;
  /** Time left over, smaller than one step. */
  readonly remainder: number;
};

export function createStepper(fixedDt: number, maxStepsPerFrame: number): Stepper {
  let acc = 0;
  return {
    advance(simDelta, step) {
      acc += simDelta;
      let n = Math.floor(acc / fixedDt);
      if (n > maxStepsPerFrame) {
        n = maxStepsPerFrame;
        acc = n * fixedDt;
      }
      for (let i = 0; i < n; i++) step(fixedDt);
      acc -= n * fixedDt;
      return n * fixedDt;
    },
    get remainder() {
      return acc;
    },
  };
}
