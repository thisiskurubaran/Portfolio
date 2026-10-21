"use client";

import { useFrame } from "@react-three/fiber";
import { DAY_MS } from "@/physics/constants";
import { stations } from "@/content/stations";
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
      const next = transit.stops[store.stationIndex];
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
        store.setStationIndex(Math.min(store.stationIndex + 1, stations.length));
        store.setTransitMode("cruise");
        store.setWarp(CRUISE_WARP);
      }
      break;
    default:
      break;
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
        store.setStationIndex(0);
        store.setTransitMode("cruise");
        store.setPhase("transit");
        store.setWarp(CRUISE_WARP);
      }
    } else {
      updateTransitFrame(t);
      updateView(shipAu(), null);
      stepTransit(t);
    }
    updateLocal();
  }, -100);
  return null;
}
