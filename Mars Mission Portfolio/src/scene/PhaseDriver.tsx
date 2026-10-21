"use client";

import { useFrame } from "@react-three/fiber";
import { simNow } from "@/state/simClock";
import { useStore } from "@/state/store";
import { ascentWarp, EVENTS } from "./launch/ascentProfile";
import {
  ascent,
  beginAscent,
  updateAscentFrame,
  updateOrbitFrame,
  updatePadFrame,
} from "./missionRuntime";
import { updateLocal } from "./localRuntime";
import { updateSky } from "./skyRuntime";

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
    } else {
      updateOrbitFrame(t);
    }
    updateLocal();
  }, -100);
  return null;
}
