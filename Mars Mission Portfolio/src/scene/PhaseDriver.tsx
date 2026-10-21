"use client";

import { useFrame } from "@react-three/fiber";
import { DAY_MS } from "@/physics/constants";
import type { StopId } from "@/content/stops";
import { observer } from "@/state/observer";
import { simNow } from "@/state/simClock";
import { CRUISE_WARP, useStore } from "@/state/store";
import { ascentWarp, EVENTS } from "./launch/ascentProfile";
import { ascent, beginAscent, frame, updateAscentFrame, updateOrbitFrame, updatePadFrame } from "./missionRuntime";
import { updateLocal } from "./localRuntime";
import { updateSky, updateView } from "./skyRuntime";
import { beginTransfer, shipAu, TMI_REAL_S, transit, updateTransitFrame } from "./transitRuntime";

/** Real seconds for each scripted docking move. */
export const APPROACH_S = 10;
export const DOCKING_S = 5;
export const UNDOCKING_S = 5;
/** Stop this far short of Mars: about where its gravity starts to dominate. */
const ARRIVAL_MARGIN_MS = 2.5 * DAY_MS;

function stepTransit(t: number): void {
  const store = useStore.getState();
  const since = (Date.now() - store.modeSince) / 1000;
  switch (store.transitMode) {
    case "cruise": {
      const next = transit.visits[store.visitIndex];
      if (next && t >= next.tMs) {
        store.setWarp(1);
        store.setTransitMode("approach");
      } else if (!next && transit.plan && t >= transit.plan.arriveMs - ARRIVAL_MARGIN_MS) {
        store.setWarp(1);
        store.setTransitMode("arrived");
      }
      break;
    }
    case "approach":
      if (since >= APPROACH_S) store.setTransitMode("holding");
      break;
    case "docking":
      if (since >= DOCKING_S) store.setTransitMode("docked");
      break;
    case "undocking":
      if (since >= UNDOCKING_S) {
        store.setVisitIndex(Math.min(store.visitIndex + 1, transit.visits.length));
        store.setTransitMode("cruise");
        store.setWarp(CRUISE_WARP);
      }
      break;
    default:
      break;
  }
}

/** Which stop the ship is parked at, and how far into the move there or back it is. */
function stopFraming(): { stopId: StopId | null; blend: number } {
  const store = useStore.getState();
  const visit = transit.visits[store.visitIndex];
  if (!visit || visit.kind !== "stop") return { stopId: null, blend: 0 };
  const since = (Date.now() - store.modeSince) / 1000;
  switch (store.transitMode) {
    case "approach":
      return { stopId: visit.stop, blend: Math.min(since / APPROACH_S, 1) };
    case "holding":
    case "docking":
    case "docked":
      return { stopId: visit.stop, blend: 1 };
    case "undocking":
      return { stopId: visit.stop, blend: Math.max(1 - since / UNDOCKING_S, 0) };
    default:
      return { stopId: null, blend: 0 };
  }
}

/**
 * Advances the sky and the mission state once per frame, before anything
 * else reads them. All phase changes driven by time happen here.
 */
export function PhaseDriver() {
  useFrame(() => {
    const store = useStore.getState();

    if (store.phase === "countdown" && Date.now() >= store.countdownEndsAt) {
      const liftoff = simNow();
      beginAscent(liftoff);
      store.setLiftoff(liftoff);
      store.setPhase("ascent");
    }

    const t = simNow();
    updateSky(t);

    const phase = useStore.getState().phase;
    if (phase !== "transit") observer.au = null;
    if (phase === "pad" || phase === "countdown") {
      updatePadFrame();
    } else if (phase === "ascent") {
      updateAscentFrame(t);
      const warp = ascentWarp(ascent.t);
      if (warp !== store.warp) store.setWarp(warp);
      if (ascent.t >= EVENTS.orbit) {
        store.setWarp(1);
        store.setPhase("orbit");
      }
    } else if (phase === "orbit") {
      updateOrbitFrame(t);
    } else if (phase === "tmi") {
      updateOrbitFrame(t);
      if ((Date.now() - store.modeSince) / 1000 >= TMI_REAL_S) {
        beginTransfer(frame.originKm);
        store.setVisitIndex(0);
        store.setTransitMode("cruise");
        store.setPhase("transit");
        store.setWarp(CRUISE_WARP);
      }
    } else {
      const { stopId, blend } = stopFraming();
      updateTransitFrame(t, stopId, blend);
      const au = shipAu();
      updateView(au, null);
      observer.au = au;
      stepTransit(t);
    }
    updateLocal();
  }, -100);
  return null;
}
