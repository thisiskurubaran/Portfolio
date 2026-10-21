import { create } from "zustand";
import type { OtherPlanet } from "@/scene/skyRuntime";
import { resetToNow, setWarp as setClockWarp } from "./simClock";

/**
 * Mission phases on the one timeline. Later milestones add transit, Mars
 * approach and surface.
 */
export type Phase = "pad" | "countdown" | "ascent" | "orbit";

export const COUNTDOWN_S = 10;

type State = {
  phase: Phase;
  /** Wall clock time the countdown reaches zero, ms. */
  countdownEndsAt: number;
  /** Simulated time of liftoff, ms, or null before launch. */
  liftoffMs: number | null;
  /** Simulated seconds per real second. */
  warp: number;
  selectedBody: OtherPlanet | null;
  setPhase: (phase: Phase) => void;
  setLiftoff: (ms: number | null) => void;
  startCountdown: () => void;
  setWarp: (warp: number) => void;
  resetTime: () => void;
  selectBody: (id: OtherPlanet | null) => void;
};

export const useStore = create<State>((set) => ({
  phase: "pad",
  countdownEndsAt: 0,
  liftoffMs: null,
  warp: 1,
  selectedBody: null,
  setPhase: (phase) => set({ phase }),
  setLiftoff: (liftoffMs) => set({ liftoffMs }),
  startCountdown: () =>
    set({ phase: "countdown", countdownEndsAt: Date.now() + COUNTDOWN_S * 1000 }),
  setWarp: (warp) => {
    setClockWarp(warp);
    set({ warp });
  },
  resetTime: () => {
    resetToNow();
    set({ warp: 1 });
  },
  selectBody: (selectedBody) => set({ selectedBody }),
}));
