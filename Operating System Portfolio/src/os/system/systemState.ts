import { create } from "zustand";
import { firstVisit, markBooted } from "./session";

export type SystemPhase = "booting" | "running" | "sleeping" | "off";

// The power menu (lock aside, which each shell owns): sleep shows the
// screensaver, restart replays the boot, shut down leaves a power button.
interface SystemStore {
  phase: SystemPhase;
  finishBoot: () => void;
  sleep: () => void;
  wake: () => void;
  restart: () => void;
  shutDown: () => void;
}

// The pointer is usually still moving when Sleep is clicked; ignore input for a
// moment so it does not wake straight away.
const WAKE_GRACE_MS = 1000;
let sleptAt = 0;

export const useSystem = create<SystemStore>((set) => ({
  phase: firstVisit ? "booting" : "running",
  finishBoot: () => {
    markBooted();
    set({ phase: "running" });
  },
  sleep: () => {
    sleptAt = Date.now();
    set({ phase: "sleeping" });
  },
  wake: () => set((s) => (s.phase === "sleeping" && Date.now() - sleptAt > WAKE_GRACE_MS ? { phase: "running" } : s)),
  restart: () => set({ phase: "booting" }),
  shutDown: () => set({ phase: "off" }),
}));
