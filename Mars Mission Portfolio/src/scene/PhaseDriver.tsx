"use client";

import { useFrame } from "@react-three/fiber";
import { DAY_MS } from "@/physics/constants";
import type { StopId } from "@/content/stops";
import { observer } from "@/state/observer";
import { jumpTo, simNow } from "@/state/simClock";
import { CRUISE_WARP, useStore } from "@/state/store";
import { ascentWarp, EVENTS } from "./launch/ascentProfile";
import { ascent, beginAscent, frame, updateAscentFrame, updateOrbitFrame, updatePadFrame } from "./missionRuntime";
import { local, updateLocal } from "./localRuntime";
import {
  AEROCAPTURE_HALF_S,
  BURN_REAL_S,
  captureStep,
  mars,
  shipAuAtMars,
  spend,
  updateMarsFrame,
} from "./marsRuntime";
import { EDL, edlAltitudeKm, edlStep, surface, surfaceAu, updateSurfaceFrame } from "./surfaceRuntime";
import { marsVisits, resetMarsVisits } from "./visits";
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
  if (store.transitMode === "cruise") {
    const next = transit.visits[store.visitIndex];
    if (next && t >= next.tMs) {
      store.setWarp(1);
      store.setTransitMode("approach");
    } else if (!next && transit.plan && t >= transit.plan.arriveMs - ARRIVAL_MARGIN_MS) {
      store.setWarp(1);
      store.setTransitMode("arrived");
    }
    return;
  }
  stepDocking(transit.visits.length, CRUISE_WARP);
}

/** The scripted docking moves, shared by stations, Earth stops and Mars stops. */
function stepDocking(visitCount: number, warpAfter: number): void {
  const store = useStore.getState();
  const since = (Date.now() - store.modeSince) / 1000;
  switch (store.transitMode) {
    case "approach":
      if (since >= APPROACH_S) store.setTransitMode("holding");
      break;
    case "docking":
      if (since >= DOCKING_S) store.setTransitMode("docked");
      break;
    case "undocking":
      if (since >= UNDOCKING_S) {
        store.setVisitIndex(Math.min(store.visitIndex + 1, visitCount));
        store.setTransitMode("cruise");
        store.setWarp(warpAfter);
      }
      break;
    default:
      break;
  }
}

/**
 * Warp that drains the time left to an event in a few real seconds while
 * never overshooting it: the remaining time halves every couple of seconds.
 */
function easeWarp(remainingMs: number, max: number): number {
  return Math.min(Math.max(remainingMs / 1000 / 2, 1), max);
}

function setWarpIfChanged(warp: number): void {
  const store = useStore.getState();
  // Avoid re-rendering the HUD every frame for tiny changes.
  if (Math.abs(warp - store.warp) / Math.max(store.warp, 1) > 0.1 || (warp === 1 && store.warp !== 1)) store.setWarp(warp);
}

function stepCapture(t: number): void {
  const store = useStore.getState();
  const step = captureStep(t);
  local.engineBurn = false;
  if (step === "approach") setWarpIfChanged(easeWarp(mars.periMs - AEROCAPTURE_HALF_S * 1000 - t, 86_400));
  else if (step === "aerocapture") setWarpIfChanged(40);
  else if (step === "coast") setWarpIfChanged(easeWarp(mars.apoMs - t, 3600));
  else {
    // At apoapsis: hold time still and play the insertion burn.
    if (store.warp !== 0) {
      store.setWarp(0);
      store.setTransitMode("cruise");
    }
    local.engineBurn = true;
    if ((Date.now() - store.modeSince) / 1000 >= BURN_REAL_S) {
      local.engineBurn = false;
      spend(mars.insertionDv);
      resetMarsVisits();
      jumpTo(mars.apoMs + 1000);
      store.setWarp(1);
      store.setVisitIndex(0);
      store.setPhase("marsOrbit");
      store.setTransitMode("approach");
    }
  }
}

function stepMarsOrbit(): void {
  const store = useStore.getState();
  if (store.transitMode === "transfer") {
    local.engineBurn = false;
    if (!mars.transfer) {
      store.setWarp(1);
      store.setTransitMode("approach");
    } else {
      setWarpIfChanged(easeWarp(mars.transfer.endMs - simNow(), 3600));
    }
    return;
  }
  if (store.transitMode === "cruise") return;
  stepDocking(marsVisits.length, 1);
}

/** Which stop the ship is parked at, and how far into the move there or back it is. */
function stopFraming(): { stopId: StopId | null; blend: number } {
  const store = useStore.getState();
  const visit = transit.visits[store.visitIndex];
  if (!visit || visit.kind !== "stop" || (visit.stop !== "moon" && visit.stop !== "l2")) return { stopId: null, blend: 0 };
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
    } else if (phase === "transit") {
      const { stopId, blend } = stopFraming();
      updateTransitFrame(t, stopId, blend);
      const au = shipAu();
      updateView(au, null);
      observer.au = au;
      stepTransit(t);
    } else if (phase === "capture" || phase === "marsOrbit") {
      updateMarsFrame(t, phase);
      const au = shipAuAtMars();
      updateView(au, null);
      observer.au = au;
      if (phase === "capture") stepCapture(t);
      else stepMarsOrbit();
    } else {
      const since = phase === "descent" ? (Date.now() - surface.startedAt) / 1000 : EDL.touchdown;
      updateSurfaceFrame(t, edlAltitudeKm(since));
      const au = surfaceAu();
      updateView(au, "mars");
      observer.au = au;
      const step = edlStep(since);
      local.engineBurn = phase === "descent" && (step === "deorbit" || step === "powered");
      if (phase === "descent" && step === "touchdown") {
        local.engineBurn = false;
        store.setPhase("surface");
      }
    }
    updateLocal();
  }, -100);
  return null;
}
