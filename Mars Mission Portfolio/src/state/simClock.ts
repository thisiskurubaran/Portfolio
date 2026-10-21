/**
 * Simulation time, read every frame outside React. The scene shows the real
 * solar system at the real current moment, so the clock starts from the
 * wall clock and only drifts from it under time warp.
 */
const state = {
  /** Wall clock reading when the warp last changed. */
  anchorReal: Date.now(),
  /** Simulation time at that moment. */
  anchorSim: Date.now(),
  warp: 1,
};

export function simNow(real = Date.now()): number {
  return state.anchorSim + (real - state.anchorReal) * state.warp;
}

export function setWarp(warp: number, real = Date.now()): void {
  state.anchorSim = simNow(real);
  state.anchorReal = real;
  state.warp = warp;
}

export function getWarp(): number {
  return state.warp;
}

/** Jumps back to the wall clock at 1x. */
export function resetToNow(real = Date.now()): void {
  state.anchorSim = real;
  state.anchorReal = real;
  state.warp = 1;
}
