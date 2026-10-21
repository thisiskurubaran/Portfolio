import { create } from "zustand";
import type { LandingSite } from "@/content/landingSites";
import type { PlanetId } from "@/space/elements";
import { resetToNow, setWarp as setClockWarp } from "./simClock";

/**
 * Mission phases on the one timeline. Later milestones add transit, Mars
 * approach and surface.
 */
export type Phase = "pad" | "countdown" | "ascent" | "orbit" | "tmi" | "transit" | "capture" | "marsOrbit" | "descent" | "surface";

/**
 * Cruise sub states. The ship coasts until it reaches a station, holds
 * nearby while the visitor decides, and docks to open the station.
 */
export type TransitMode =
  | "cruise"
  | "approach"
  | "holding"
  | "docking"
  | "docked"
  | "undocking"
  | "arrived"
  /** Between Mars's moons on a transfer orbit. */
  | "transfer";

/** Default cruise warp: a day per second, so the 200 to 300 day transfer takes a few minutes. */
export const CRUISE_WARP = 86_400;

export const COUNTDOWN_S = 10;

export type PlainOfferReason = "no-webgl" | "slow";

type State = {
  phase: Phase;
  plainOffer: PlainOfferReason | null;
  /** Set once the visitor waves the offer away, so it does not come back. */
  plainOfferDismissed: boolean;
  offerPlain: (reason: PlainOfferReason) => void;
  dismissPlainOffer: () => void;
  /** Wall clock time the countdown reaches zero, ms. */
  countdownEndsAt: number;
  /** Simulated time of liftoff, ms, or null before launch. */
  liftoffMs: number | null;
  /** Simulated seconds per real second. */
  warp: number;
  selectedBody: PlanetId | null;
  /** Deep dive, base or wreck the rover is parked next to, by id. */
  surfaceTarget: string | null;
  setSurfaceTarget: (id: string | null) => void;
  /** Where the crew means to land, picked in Mars orbit. */
  landingSite: LandingSite | null;
  setLandingSite: (site: LandingSite) => void;
  transitMode: TransitMode;
  /** Index into the visit list: the station or stop being visited, or the next one. */
  visitIndex: number;
  /** Wall clock time the current transit mode started, ms. */
  modeSince: number;
  setTransitMode: (mode: TransitMode) => void;
  setVisitIndex: (index: number) => void;
  setPhase: (phase: Phase) => void;
  setLiftoff: (ms: number | null) => void;
  startCountdown: () => void;
  setWarp: (warp: number) => void;
  resetTime: () => void;
  selectBody: (id: PlanetId | null) => void;
};

export const useStore = create<State>((set, get) => ({
  phase: "pad",
  plainOffer: null,
  plainOfferDismissed: false,
  offerPlain: (reason) => {
    if (!get().plainOfferDismissed) set({ plainOffer: reason });
  },
  dismissPlainOffer: () => set({ plainOffer: null, plainOfferDismissed: true }),
  countdownEndsAt: 0,
  liftoffMs: null,
  warp: 1,
  selectedBody: null,
  landingSite: null,
  surfaceTarget: null,
  setSurfaceTarget: (surfaceTarget) => set({ surfaceTarget }),
  setLandingSite: (landingSite) => set({ landingSite }),
  transitMode: "cruise",
  visitIndex: 0,
  modeSince: 0,
  setTransitMode: (transitMode) => set({ transitMode, modeSince: Date.now() }),
  setVisitIndex: (visitIndex) => set({ visitIndex }),
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
