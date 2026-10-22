"use client";

import { useEffect, useSyncExternalStore } from "react";
import { wallpaperBackground } from "@/design/wallpapers";
import { usePreferences } from "@/os/state/preferences";
import { useDaypart } from "./daypart";
import { usePower } from "./power";

function mediaStore(query: string) {
  return {
    subscribe: (cb: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    get: () => window.matchMedia(query).matches,
  };
}

const reducedMotionQuery = mediaStore("(prefers-reduced-motion: reduce)");
const darkQuery = mediaStore("(prefers-color-scheme: dark)");

export function usePrefersReducedMotion() {
  return useSyncExternalStore(reducedMotionQuery.subscribe, reducedMotionQuery.get, () => false);
}

// True when either the OS asks for less motion or the visitor turned it on in folioOS.
export function useReducedMotion() {
  const system = usePrefersReducedMotion();
  const chosen = usePreferences((s) => s.reducedMotion);
  return system || chosen;
}

export function useResolvedTheme(): "light" | "dark" {
  const mode = usePreferences((s) => s.theme);
  const systemDark = useSyncExternalStore(darkQuery.subscribe, darkQuery.get, () => true);
  const daypart = useDaypart();
  if (mode === "light" || mode === "dark") return mode;
  if (mode === "auto") return daypart === "day" ? "light" : "dark";
  return systemDark ? "dark" : "light";
}

export function useWallpaper() {
  const id = usePreferences((s) => s.wallpaper);
  const theme = useResolvedTheme();
  const daypart = useDaypart();
  return wallpaperBackground(id, theme, daypart);
}

// Mirrors OS state onto <html> so plain CSS can react without every
// component subscribing to the stores.
export function useSystemAttributes() {
  const reduced = useReducedMotion();
  const theme = useResolvedTheme();
  const accent = usePreferences((s) => s.accent);
  const lowPower = usePower((s) => s.lowPower);
  useEffect(() => {
    const root = document.documentElement;
    root.toggleAttribute("data-low-power", lowPower);
    root.toggleAttribute("data-reduced-motion", reduced);
    root.dataset.theme = theme;
    root.style.setProperty("--color-accent", accent);
  }, [reduced, theme, accent, lowPower]);
}
