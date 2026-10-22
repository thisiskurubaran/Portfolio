import { create } from "zustand";

export type DeskOverlay = "spotlight" | "overview" | "center" | null;

interface DeskStore {
  overlay: DeskOverlay;
  setOverlay: (overlay: DeskOverlay) => void;
  toggle: (overlay: Exclude<DeskOverlay, null>) => void;
}

export const useDesk = create<DeskStore>((set) => ({
  overlay: null,
  setOverlay: (overlay) => set({ overlay }),
  toggle: (overlay) => set((s) => ({ overlay: s.overlay === overlay ? null : overlay })),
}));
