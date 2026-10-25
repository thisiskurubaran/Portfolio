import { create } from "zustand";
import type { AppId } from "@/os/apps/registry";
import { firstVisit } from "@/os/system/session";

export type PhoneOverlay = "control" | "shade" | "search" | "switcher" | "launcher" | null;

// Where an app icon sat on screen, so the app can zoom out of it and back.
export interface Origin {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface PhoneStore {
  locked: boolean;
  app: AppId | null;
  origin: Origin | null;
  // Most recent first, for the app switcher.
  recents: AppId[];
  overlay: PhoneOverlay;
  unlock: () => void;
  closeRecent: (id: AppId) => void;
  lock: () => void;
  openApp: (id: AppId, origin?: Origin | null) => void;
  goHome: () => void;
  setOverlay: (overlay: PhoneOverlay) => void;
}

export const usePhone = create<PhoneStore>((set) => ({
  locked: firstVisit,
  app: null,
  origin: null,
  recents: [],
  overlay: null,
  unlock: () => set({ locked: false }),
  closeRecent: (id) => set((s) => ({ recents: s.recents.filter((r) => r !== id), app: s.app === id ? null : s.app })),
  lock: () => set({ locked: true, overlay: null }),
  openApp: (id, origin = null) => set((s) => ({ app: id, origin, overlay: null, recents: [id, ...s.recents.filter((r) => r !== id)].slice(0, 8) })),
  goHome: () => set({ app: null, overlay: null }),
  setOverlay: (overlay) => set({ overlay }),
}));

// Turns a tapped element into an origin relative to the phone screen.
export function originOf(el: Element): Origin {
  const r = el.getBoundingClientRect();
  const screen = el.closest("main")?.getBoundingClientRect() ?? { left: 0, top: 0 };
  return { x: r.left - screen.left, y: r.top - screen.top, w: r.width, h: r.height };
}
