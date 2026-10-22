import { create } from "zustand";
import type { AppId } from "@/os/apps/registry";

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
}

interface WindowsStore {
  windows: WindowState[];
  focusedId: string | null;
  nextZ: number;
  open: (appId: AppId) => string;
  close: (id: string) => void;
  focus: (id: string) => void;
  minimize: (id: string) => void;
  toggleMaximize: (id: string) => void;
  move: (id: string, x: number, y: number) => void;
  resize: (id: string, width: number, height: number) => void;
  setRect: (id: string, rect: Rect) => void;
}

const patch = (list: WindowState[], id: string, change: Partial<WindowState>) =>
  list.map((w) => (w.id === id ? { ...w, ...change } : w));

export const useWindows = create<WindowsStore>((set, get) => ({
  windows: [],
  focusedId: null,
  nextZ: 1,

  // One window per app: opening an open app focuses it instead.
  open: (appId) => {
    const existing = get().windows.find((w) => w.appId === appId);
    if (existing) {
      get().focus(existing.id);
      return existing.id;
    }
    const { windows, nextZ } = get();
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
    };
    set({ windows: [...windows, win], focusedId: win.id, nextZ: nextZ + 1 });
    return win.id;
  },

  close: (id) =>
    set((s) => {
      const windows = s.windows.filter((w) => w.id !== id);
      const top = [...windows].filter((w) => !w.minimized).sort((a, b) => b.z - a.z)[0];
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
      const top = windows.filter((w) => !w.minimized).sort((a, b) => b.z - a.z)[0];
      return { windows, focusedId: s.focusedId === id ? (top?.id ?? null) : s.focusedId };
    }),

  toggleMaximize: (id) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, maximized: !w.maximized } : w)),
    })),

  setRect: (id, rect) =>
    set((s) => ({ windows: patch(s.windows, id, { ...rect, maximized: false }) })),
  move: (id, x, y) => set((s) => ({ windows: patch(s.windows, id, { x, y }) })),
  resize: (id, width, height) =>
    set((s) => ({
      windows: patch(s.windows, id, { width: Math.max(320, width), height: Math.max(220, height) }),
    })),
}));
