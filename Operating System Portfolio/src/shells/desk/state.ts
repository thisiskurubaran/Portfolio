import { create } from "zustand";
import { firstVisit } from "@/os/system/session";

export type DeskOverlay = "spotlight" | "overview" | "center" | "menu" | null;

interface DeskStore {
  loggedIn: boolean;
  setLoggedIn: (value: boolean) => void;
  overlay: DeskOverlay;
  setOverlay: (overlay: DeskOverlay) => void;
  toggle: (overlay: Exclude<DeskOverlay, null>) => void;
}

export const useDesk = create<DeskStore>((set) => ({
  loggedIn: !firstVisit,
  setLoggedIn: (loggedIn) => set({ loggedIn, overlay: null }),
  overlay: null,
  setOverlay: (overlay) => set({ overlay }),
  toggle: (overlay) => set((s) => ({ overlay: s.overlay === overlay ? null : overlay })),
}));
