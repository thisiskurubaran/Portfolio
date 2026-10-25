import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { WallpaperId } from "@/design/wallpapers";
import { safeStorage } from "./storage";

// "system" follows the OS colour scheme; "auto" follows the visitor's local
// time of day, the same signal as the dynamic wallpaper.
export type ThemeMode = "system" | "light" | "dark" | "auto";

interface PreferencesStore {
  theme: ThemeMode;
  accent: string;
  wallpaper: WallpaperId;
  reducedMotion: boolean;
  sound: boolean;
  // UI sound volume, 0 to 1.
  volume: number;
  // A dimming layer over the screen, 0.4 to 1.
  brightness: number;
  // A warm filter for the evening.
  nightLight: boolean;
  // Root text size multiplier.
  textScale: number;
  highContrast: boolean;
  bigPointer: boolean;
  // Focus: notifications go to the center quietly, without toasts or sounds.
  focus: boolean;
  update: (change: Partial<Omit<PreferencesStore, "update" | `set${string}`>>) => void;
  setTheme: (theme: ThemeMode) => void;
  setAccent: (accent: string) => void;
  setWallpaper: (wallpaper: WallpaperId) => void;
  setReducedMotion: (value: boolean) => void;
  setSound: (value: boolean) => void;
}

export const usePreferences = create<PreferencesStore>()(
  persist(
    (set) => ({
      theme: "system",
      accent: "#3d8bff",
      wallpaper: "horizon",
      reducedMotion: false,
      sound: false,
      volume: 0.6,
      brightness: 1,
      nightLight: false,
      textScale: 1,
      highContrast: false,
      bigPointer: false,
      focus: false,
      update: (change) => set(change),
      setTheme: (theme) => set({ theme }),
      setAccent: (accent) => set({ accent }),
      setWallpaper: (wallpaper) => set({ wallpaper }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      setSound: (sound) => set({ sound }),
    }),
    {
      name: "folioos.preferences",
      version: 2,
      storage: createJSONStorage(() => safeStorage),
      // v2 changed the defaults to the blue accent and the Horizon wallpaper.
      // Visitors still on the old defaults move to the new ones; choices they
      // made themselves are kept.
      migrate: (state, version) => {
        const s = (state ?? {}) as Partial<PreferencesStore>;
        if (version < 2) {
          if (s.accent === "#4cc2a8") s.accent = "#3d8bff";
          if (s.wallpaper === "dynamic") s.wallpaper = "horizon";
        }
        return s as PreferencesStore;
      },
    },
  ),
);
