import { create } from "zustand";
import { rScale, type SpaceWeather, sScale } from "@/space/spaceWeather";
import type { Conditions } from "@/weather/schema";

/**
 * F18: what the visitor picked on the mission console. "live" follows the
 * real feeds; the rest stage that event for this visitor only, and reset
 * on reload (nothing is stored).
 */
export type ConsoleMode = "live" | "clear" | "solarStorm" | "meteors" | "dustStorm";

type State = {
  conditions: Conditions | null;
  spaceWeather: SpaceWeather | null;
  mode: ConsoleMode;
  /** Dramatic versions of events: off by default, per the sensitivity rule. */
  dramatic: boolean;
  setConditions: (c: Conditions) => void;
  setSpaceWeather: (s: SpaceWeather) => void;
  setMode: (m: ConsoleMode) => void;
  setDramatic: (on: boolean) => void;
};

export const useConditions = create<State>((set) => ({
  conditions: null,
  spaceWeather: null,
  mode: "live",
  dramatic: false,
  setConditions: (conditions) => set({ conditions }),
  setSpaceWeather: (spaceWeather) => set({ spaceWeather }),
  setMode: (mode) => set({ mode }),
  setDramatic: (dramatic) => set({ dramatic }),
}));

/** The space weather the scene should show: the live feed, or the console's pick. */
export type Effective = {
  kp: number;
  /** Solar radiation storm level, NOAA S scale. */
  radiation: number;
  /** Radio blackout level from the strongest flare, NOAA R scale. */
  blackout: number;
  meteors: boolean;
  dust: boolean;
  /** True when the console staged it, so the HUD can say so. */
  staged: boolean;
};

export function effective(
  mode: ConsoleMode,
  sw: SpaceWeather | null,
  meteorsActive: boolean,
  dramatic: boolean,
): Effective {
  switch (mode) {
    case "clear":
      return { kp: 1, radiation: 0, blackout: 0, meteors: false, dust: false, staged: true };
    case "solarStorm":
      // A strong storm, or a severe one if the visitor asked for drama.
      return { kp: dramatic ? 8.7 : 7, radiation: dramatic ? 3 : 2, blackout: dramatic ? 3 : 2, meteors: false, dust: false, staged: true };
    case "meteors":
      return { kp: 2, radiation: 0, blackout: 0, meteors: true, dust: false, staged: true };
    case "dustStorm":
      return { kp: 2, radiation: 0, blackout: 0, meteors: false, dust: true, staged: true };
    default:
      return {
        kp: sw?.kp ?? 0,
        radiation: sScaleOf(sw),
        blackout: rScaleOf(sw),
        meteors: meteorsActive,
        // No live feed reports Mars dust storms; they appear only when staged.
        dust: false,
        staged: false,
      };
  }
}

function sScaleOf(sw: SpaceWeather | null): number {
  return sScale(sw?.protons ?? null);
}

function rScaleOf(sw: SpaceWeather | null): number {
  return rScale(sw?.flare?.cls ?? null);
}
