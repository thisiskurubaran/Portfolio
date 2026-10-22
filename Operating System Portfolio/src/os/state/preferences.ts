import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";

export type ThemeMode = "light" | "dark" | "auto";

interface PreferencesStore {
  theme: ThemeMode;
  accent: string;
  reducedMotion: boolean;
  sound: boolean;
  setTheme: (theme: ThemeMode) => void;
  setAccent: (accent: string) => void;
  setReducedMotion: (value: boolean) => void;
  setSound: (value: boolean) => void;
}

// localStorage can throw or be missing (private windows, blocked storage).
// Fall back to defaults in that case.
const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      window.localStorage.setItem(name, value);
    } catch {
      // ignore
    }
  },
  removeItem: (name) => {
    try {
      window.localStorage.removeItem(name);
    } catch {
      // ignore
    }
  },
};

export const usePreferences = create<PreferencesStore>()(
  persist(
    (set) => ({
      theme: "auto",
      accent: "#4cc2a8",
      reducedMotion: false,
      sound: false,
      setTheme: (theme) => set({ theme }),
      setAccent: (accent) => set({ accent }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      setSound: (sound) => set({ sound }),
    }),
    { name: "kbos.preferences", storage: createJSONStorage(() => safeStorage) },
  ),
);
