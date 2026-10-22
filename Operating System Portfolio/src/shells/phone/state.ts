import { create } from "zustand";
import type { AppId } from "@/os/apps/registry";
import { firstVisit } from "@/os/system/session";

export type PhoneOverlay = "control" | "shade" | "search" | "switcher" | null;

interface PhoneStore {
  locked: boolean;
  app: AppId | null;
  // Most recent first, for the app switcher.
  recents: AppId[];
  overlay: PhoneOverlay;
  unlock: () => void;
  closeRecent: (id: AppId) => void;
  lock: () => void;
  openApp: (id: AppId) => void;
  goHome: () => void;
  setOverlay: (overlay: PhoneOverlay) => void;
}

export const usePhone = create<PhoneStore>((set) => ({
  locked: firstVisit,
  app: null,
  recents: [],
  overlay: null,
  unlock: () => set({ locked: false }),
  closeRecent: (id) => set((s) => ({ recents: s.recents.filter((r) => r !== id), app: s.app === id ? null : s.app })),
  lock: () => set({ locked: true, overlay: null }),
  openApp: (id) => set((s) => ({ app: id, overlay: null, recents: [id, ...s.recents.filter((r) => r !== id)].slice(0, 8) })),
  goHome: () => set({ app: null, overlay: null }),
  setOverlay: (overlay) => set({ overlay }),
}));
