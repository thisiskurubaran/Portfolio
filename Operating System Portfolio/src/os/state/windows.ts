import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AppId } from "@/os/apps/registry";
import { safeStorage } from "./storage";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WindowState {
  id: string;
  appId: AppId;
  x: number;
  y: number;
  width: number;
  height: number;
  z: number;
  minimized: boolean;
  maximized: boolean;
  // F19: which virtual desktop the window lives on. Older saved layouts lack it.
  desktop?: number;
}

export const DESKTOPS = 3;
export const desktopOf = (w: WindowState) => w.desktop ?? 1;

interface WindowsStore {
  windows: WindowState[];
  focusedId: string | null;
  nextZ: number;
  currentDesktop: number;
  setDesktop: (n: number) => void;
  moveToDesktop: (id: string, n: number) => void;
  open: (appId: AppId) => string;
  close: (id: string) => void;
  focus: (id: string) => void;
  minimize: (id: string) => void;
  toggleMaximize: (id: string) => void;
  move: (id: string, x: number, y: number) => void;
  resize: (id: string, width: number, height: number) => void;
  setRect: (id: string, rect: Rect) => void;
}

const patch = (list: WindowState[], id: string, change: Partial<WindowState>) => list.map((w) => (w.id === id ? { ...w, ...change } : w));

// F09: open windows and their positions survive a reload.
export const useWindows = create<WindowsStore>()(
  persist(
    (set, get) => ({
      windows: [],
      focusedId: null,
      nextZ: 1,
      currentDesktop: 1,

      setDesktop: (n) =>
        set((s) => {
          const top = s.windows.filter((w) => desktopOf(w) === n && !w.minimized).sort((a, b) => b.z - a.z)[0];
          return { currentDesktop: Math.min(DESKTOPS, Math.max(1, n)), focusedId: top?.id ?? null };
        }),

      moveToDesktop: (id, n) =>
        set((s) => {
          const windows = patch(s.windows, id, { desktop: n });
          const top = windows.filter((w) => desktopOf(w) === s.currentDesktop && !w.minimized).sort((a, b) => b.z - a.z)[0];
          return { windows, focusedId: s.focusedId === id ? (top?.id ?? null) : s.focusedId };
        }),

      // One window per app: opening an open app focuses it instead.
      open: (appId) => {
        const existing = get().windows.find((w) => w.appId === appId);
        if (existing) {
          // Opening an app that lives on another desktop takes you there.
          if (desktopOf(existing) !== get().currentDesktop) set({ currentDesktop: desktopOf(existing) });
          get().focus(existing.id);
          return existing.id;
        }
        const { windows, nextZ, currentDesktop } = get();
        const offset = (windows.length % 8) * 28;
        const win: WindowState = {
          id: `${appId}-${nextZ}`,
          appId,
          x: 80 + offset,
          y: 60 + offset,
          width: 720,
          height: 480,
          z: nextZ,
          minimized: false,
          maximized: false,
          desktop: currentDesktop,
        };
        set({ windows: [...windows, win], focusedId: win.id, nextZ: nextZ + 1 });
        return win.id;
      },

      close: (id) =>
        set((s) => {
          const windows = s.windows.filter((w) => w.id !== id);
          const top = [...windows].filter((w) => !w.minimized && desktopOf(w) === s.currentDesktop).sort((a, b) => b.z - a.z)[0];
          return { windows, focusedId: s.focusedId === id ? (top?.id ?? null) : s.focusedId };
        }),

      focus: (id) =>
        set((s) => ({
          windows: patch(s.windows, id, { z: s.nextZ, minimized: false }),
          focusedId: id,
          nextZ: s.nextZ + 1,
        })),

      minimize: (id) =>
        set((s) => {
          const windows = patch(s.windows, id, { minimized: true });
          const top = windows.filter((w) => !w.minimized && desktopOf(w) === s.currentDesktop).sort((a, b) => b.z - a.z)[0];
          return { windows, focusedId: s.focusedId === id ? (top?.id ?? null) : s.focusedId };
        }),

      toggleMaximize: (id) =>
        set((s) => ({
          windows: s.windows.map((w) => (w.id === id ? { ...w, maximized: !w.maximized } : w)),
        })),

      setRect: (id, rect) => set((s) => ({ windows: patch(s.windows, id, { ...rect, maximized: false }) })),
      move: (id, x, y) => set((s) => ({ windows: patch(s.windows, id, { x, y }) })),
      resize: (id, width, height) =>
        set((s) => ({
          windows: patch(s.windows, id, { width: Math.max(320, width), height: Math.max(220, height) }),
        })),
    }),
    {
      name: "folioos.windows",
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({ windows: s.windows, focusedId: s.focusedId, nextZ: s.nextZ, currentDesktop: s.currentDesktop }),
    },
  ),
);
