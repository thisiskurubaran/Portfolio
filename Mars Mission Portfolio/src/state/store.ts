import { create } from "zustand";
import type { OtherPlanet } from "@/scene/skyRuntime";
import { resetToNow, setWarp as setClockWarp } from "./simClock";

type State = {
  /** Simulated seconds per real second. */
  warp: number;
  selectedBody: OtherPlanet | null;
  setWarp: (warp: number) => void;
  resetTime: () => void;
  selectBody: (id: OtherPlanet | null) => void;
};

export const useStore = create<State>((set) => ({
  warp: 1,
  selectedBody: null,
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
