import { create } from "zustand";
import { firstVisit } from "@/os/system/session";
import type { MenuItem } from "@/shells/shared/Menu";

export interface OpenMenu {
  x: number;
  y: number;
  label: string;
  items: MenuItem[];
  above?: boolean;
}

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
  menu: OpenMenu | null;
  openMenu: (menu: OpenMenu) => void;
  closeMenu: () => void;
}

export const useDesk = create<DeskStore>((set) => ({
  loggedIn: !firstVisit,
  addedSticky: 0,
  bumpSticky: () => set((s) => ({ addedSticky: s.addedSticky + 1 })),
  setLoggedIn: (loggedIn) => set({ loggedIn, overlay: null }),
  overlay: null,
  setOverlay: (overlay) => set({ overlay }),
  toggle: (overlay) => set((s) => ({ overlay: s.overlay === overlay ? null : overlay })),
  menu: null,
  openMenu: (menu) => set({ menu }),
  closeMenu: () => set({ menu: null }),
}));
