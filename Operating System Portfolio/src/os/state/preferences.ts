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
      accent: "#4cc2a8",
      wallpaper: "dynamic",
      reducedMotion: false,
      sound: false,
      setTheme: (theme) => set({ theme }),
      setAccent: (accent) => set({ accent }),
      setWallpaper: (wallpaper) => set({ wallpaper }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      setSound: (sound) => set({ sound }),
    }),
    { name: "folioos.preferences", version: 1, storage: createJSONStorage(() => safeStorage) },
  ),
);
