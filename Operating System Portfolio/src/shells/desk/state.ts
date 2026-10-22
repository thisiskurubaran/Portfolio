import { create } from "zustand";
import { firstVisit } from "@/os/system/session";

export type DeskOverlay = "spotlight" | "overview" | "center" | "menu" | "sticky" | "control" | "launcher" | null;

interface DeskStore {
  loggedIn: boolean;
  // Bumped after posting a sticky note so the layer reloads.
  addedSticky: number;
  bumpSticky: () => void;
  setLoggedIn: (value: boolean) => void;
  overlay: DeskOverlay;
  setOverlay: (overlay: DeskOverlay) => void;
  toggle: (overlay: Exclude<DeskOverlay, null>) => void;
}

export const useDesk = create<DeskStore>((set) => ({
  loggedIn: !firstVisit,
  addedSticky: 0,
  bumpSticky: () => set((s) => ({ addedSticky: s.addedSticky + 1 })),
  setLoggedIn: (loggedIn) => set({ loggedIn, overlay: null }),
  overlay: null,
  setOverlay: (overlay) => set({ overlay }),
  toggle: (overlay) => set((s) => ({ overlay: s.overlay === overlay ? null : overlay })),
}));
