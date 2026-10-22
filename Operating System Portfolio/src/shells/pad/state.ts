import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AppId } from "@/os/apps/registry";
import { safeStorage } from "@/os/state/storage";
import { firstVisit } from "@/os/system/session";

export type PadPane = "primary" | "secondary" | "slide";
export type PadOverlay = "control" | "shade" | "search" | "switcher" | "picker" | null;

interface PadStore {
  locked: boolean;
  setLocked: (locked: boolean) => void;
  primary: AppId | null;
  secondary: AppId | null;
  // Share of the width the primary pane takes in split view.
  ratio: number;
  slide: AppId | null;
  slideHidden: boolean;
  overlay: PadOverlay;
  pickerFor: "split" | "slide" | null;
  recents: AppId[];
  open: (id: AppId) => void;
  openIn: (pane: "secondary" | "slide", id: AppId) => void;
  close: (pane: PadPane) => void;
  fullScreen: (pane: PadPane) => void;
  moveToSlide: (pane: "primary" | "secondary") => void;
  setRatio: (ratio: number) => void;
  setSlideHidden: (hidden: boolean) => void;
  setOverlay: (overlay: PadOverlay) => void;
  pick: (mode: "split" | "slide") => void;
  goHome: () => void;
}

const remember = (recents: AppId[], id: AppId) => [id, ...recents.filter((r) => r !== id)].slice(0, 8);

export const usePad = create<PadStore>()(
  persist(
    (set) => ({
      locked: firstVisit,
      setLocked: (locked) => set({ locked, overlay: null }),
      primary: null,
      secondary: null,
      ratio: 0.5,
      slide: null,
      slideHidden: false,
      overlay: null,
      pickerFor: null,
      recents: [],
      open: (id) =>
        set((s) => ({
          primary: id,
          secondary: s.secondary === id ? null : s.secondary,
          slide: s.slide === id ? null : s.slide,
          overlay: null,
          recents: remember(s.recents, id),
        })),
      openIn: (pane, id) =>
        set((s) => {
          if (pane === "secondary") {
            // Split view needs something on the left; the new app fills it if empty.
            if (!s.primary) return { primary: id, overlay: null, pickerFor: null, recents: remember(s.recents, id) };
            if (s.primary === id) return { overlay: null, pickerFor: null };
            return { secondary: id, slide: s.slide === id ? null : s.slide, overlay: null, pickerFor: null, recents: remember(s.recents, id) };
          }
          return {
            slide: id,
            slideHidden: false,
            primary: s.primary === id ? s.secondary : s.primary,
            secondary: s.primary === id || s.secondary === id ? null : s.secondary,
            overlay: null,
            pickerFor: null,
            recents: remember(s.recents, id),
          };
        }),
      close: (pane) =>
        set((s) => {
          if (pane === "slide") return { slide: null };
          if (pane === "secondary") return { secondary: null };
          return { primary: s.secondary, secondary: null };
        }),
      fullScreen: (pane) =>
        set((s) => {
          const id = s[pane];
          if (!id) return {};
          return {
            primary: id,
            secondary: null,
            slide: pane === "slide" ? null : s.slide,
          };
        }),
      moveToSlide: (pane) =>
        set((s) => {
          const id = s[pane];
          if (!id) return {};
          return pane === "primary"
            ? { slide: id, slideHidden: false, primary: s.secondary, secondary: null }
            : { slide: id, slideHidden: false, secondary: null };
        }),
      setRatio: (ratio) => set({ ratio: Math.min(0.75, Math.max(0.25, ratio)) }),
      setSlideHidden: (slideHidden) => set({ slideHidden }),
      setOverlay: (overlay) => set((s) => ({ overlay, pickerFor: overlay === "picker" ? s.pickerFor : null })),
      pick: (mode) => set({ overlay: "picker", pickerFor: mode }),
      goHome: () => set({ primary: null, secondary: null, overlay: null }),
    }),
    {
      name: "kbos.pad",
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({ primary: s.primary, secondary: s.secondary, ratio: s.ratio, slide: s.slide, recents: s.recents }),
    },
  ),
);
