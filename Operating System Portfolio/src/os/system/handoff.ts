import { create } from "zustand";
import type { Shell } from "@/os/device/resolve";

// F02: relaunching the portfolio as another device. The overlay in Boot plays
// the animation and swaps the shell halfway through.
interface HandoffStore {
  target: Shell | null;
  start: (target: Shell) => void;
  finish: () => void;
}

export const useHandoff = create<HandoffStore>((set) => ({
  target: null,
  start: (target) => set({ target }),
  finish: () => set({ target: null }),
}));
