import { ascent, skipToOrbit } from "@/scene/missionRuntime";
import { simNow } from "@/state/simClock";
import { useStore } from "@/state/store";

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
