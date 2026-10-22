import { create } from "zustand";
import type { AppId } from "@/os/apps/registry";

const MAX_PANELS = 5;

interface VisionStore {
  open: AppId[];
  focused: AppId | null;
  openApp: (id: AppId) => void;
  close: (id: AppId) => void;
  focus: (id: AppId | null) => void;
  step: (dir: 1 | -1) => void;
}

export const useVision = create<VisionStore>((set, get) => ({
  open: ["experience", "about", "projects"],
  focused: "about",
  openApp: (id) =>
    set((s) => {
      if (s.open.includes(id)) return { focused: id };
      const open = [...s.open, id];
      // Too many floating panels stop being readable; the oldest one leaves.
      return { open: open.length > MAX_PANELS ? open.slice(1) : open, focused: id };
    }),
  close: (id) =>
    set((s) => {
      const open = s.open.filter((o) => o !== id);
      return { open, focused: s.focused === id ? (open[Math.floor(open.length / 2)] ?? null) : s.focused };
    }),
  focus: (focused) => set({ focused }),
  step: (dir) => {
    const { open, focused } = get();
    if (open.length === 0) return;
    const i = focused ? open.indexOf(focused) : -1;
    set({ focused: open[(i + dir + open.length) % open.length]! });
  },
}));
