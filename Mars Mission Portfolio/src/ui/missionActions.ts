import { ascent, skipToOrbit } from "@/scene/missionRuntime";
import { planTransfer, transit } from "@/scene/transitRuntime";
import { jumpTo, simNow } from "@/state/simClock";
import { useStore } from "@/state/store";

/** Thirty days per second. */
const NEXT_STATION_WARP = 2_592_000;

export function launch(): void {
  useStore.getState().startCountdown();
}

export function hold(): void {
  useStore.getState().setPhase("pad");
}

export function skip(): void {
  const store = useStore.getState();
  store.setWarp(1);
  skipToOrbit(simNow());
  store.setLiftoff(ascent.liftoffMs);
  store.setPhase("orbit");
}

/** Jumps to the planned window and starts the departure burn. */
export function depart(): void {
  // Time may have been warped past the window the panel showed.
  const plan = transit.plan && transit.plan.departMs >= simNow() ? transit.plan : planTransfer(simNow());
  if (!plan) return;
  const store = useStore.getState();
  jumpTo(plan.departMs);
  store.setWarp(1);
  // Resets the mode clock, which also times the burn.
  store.setTransitMode("cruise");
  store.setPhase("tmi");
}

export function dock(): void {
  useStore.getState().setTransitMode("docking");
}

export function undock(): void {
  useStore.getState().setTransitMode("undocking");
}

/** Runs time fast until the ship reaches the next station, where it stops on its own. */
export function toNextStation(): void {
  useStore.getState().setWarp(NEXT_STATION_WARP);
}
