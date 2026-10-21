import { ascent, skipToOrbit } from "@/scene/missionRuntime";
import type { LandingSite } from "@/content/landingSites";
import { canAfford, deorbitDv, hohmannToMoon, mars, planCapture, spend, startTransfer } from "@/scene/marsRuntime";
import { nextMorning, surface } from "@/scene/surfaceRuntime";
import { roverState } from "@/scene/surface/roverState";
import { planTransfer, transit } from "@/scene/transitRuntime";
import { marsVisits } from "@/scene/visits";
import type { MarsMoon } from "@/space/mars";
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

/** Hands the flight from the Sun to Mars: plans the approach and capture from the transfer. */
export function beginMarsApproach(): void {
  const plan = transit.plan;
  if (!plan) return;
  planCapture(plan);
  const store = useStore.getState();
  store.setTransitMode("cruise");
  store.setPhase("capture");
}

/** Hohmann transfer to the other moon, if the propellant allows it. */
export function transferTo(to: MarsMoon): void {
  const { dv1, dv2 } = hohmannToMoon(to);
  if (!canAfford(dv1 + dv2)) return;
  startTransfer(to, simNow());
  marsVisits.push({ id: to, kind: "stop", stop: to, tMs: mars.transfer!.endMs });
  const store = useStore.getState();
  store.setVisitIndex(marsVisits.length - 1);
  store.setTransitMode("transfer");
}

export function chooseLandingSite(site: LandingSite): void {
  mars.landingSite = site;
  useStore.getState().setLandingSite(site);
}

/** Deorbit burn, then entry, parachute and powered descent to the chosen site. */
export function beginDescent(): void {
  const site = mars.landingSite;
  const dv = deorbitDv();
  if (!site || !canAfford(dv)) return;
  spend(dv);
  // Wait in orbit for the site's morning, as real landers do, then come down.
  jumpTo(nextMorning(site, simNow()));
  surface.site = site;
  surface.startedAt = Date.now();
  const store = useStore.getState();
  store.setWarp(1);
  store.setPhase("descent");
}

export function rightRover(): void {
  roverState.sim?.rightUp();
}
