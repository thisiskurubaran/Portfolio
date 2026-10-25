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

// Dark text on light accents (yellow, mint), white on the rest, using the
// WCAG relative luminance of the accent.
function luminance(rgb: number[]) {
  const [r, g, b] = rgb.map((x) => {
    const v = x / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function parseHex(hex: string) {
  const c = hex.replace("#", "").match(/../g)?.map((h) => parseInt(h, 16));
  return c && c.length >= 3 ? c.slice(0, 3) : null;
}

function textOn(hex: string) {
  const c = parseHex(hex);
  return c && luminance(c) > 0.32 ? "#111114" : "#ffffff";
}

// The fill behind white labels: the accent with its lightness lowered in
// small steps (hue and saturation kept, so it stays vivid) until white text
// on it reaches 4.5:1. Light accents keep dark text and their own colour.
function fillFor(hex: string) {
  const c = parseHex(hex);
  if (!c || textOn(hex) !== "#ffffff") return hex;
  const [r, g, b] = c.map((v) => v / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let l = (max + min) / 2;
  const sat = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  const hue = d === 0 ? 0 : max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  const toRgb = (light: number) => {
    const chroma = (1 - Math.abs(2 * light - 1)) * sat;
    const x = chroma * (1 - Math.abs((hue % 2) - 1));
    const m = light - chroma / 2;
    const h = Math.floor((hue + 6) % 6);
    const [r1, g1, b1] = [[chroma, x, 0], [x, chroma, 0], [0, chroma, x], [0, x, chroma], [x, 0, chroma], [chroma, 0, x]][h]!;
    return [r1! + m, g1! + m, b1! + m].map((v) => Math.round(v * 255));
  };
  let rgb = c;
  for (let i = 0; i < 40 && 1.05 / (luminance(rgb) + 0.05) < 4.5; i++) {
    l -= 0.01;
    rgb = toRgb(l);
  }
  return `#${rgb.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

// Mirrors OS state onto <html> so plain CSS can react without every
// component subscribing to the stores.
export function useSystemAttributes() {
  const reduced = useReducedMotion();
  const theme = useResolvedTheme();
  const accent = usePreferences((s) => s.accent);
  const lowPower = usePower((s) => s.lowPower);
  const { textScale, highContrast, bigPointer } = usePreferences();
  useEffect(() => {
    const root = document.documentElement;
    root.toggleAttribute("data-high-contrast", highContrast);
    root.toggleAttribute("data-big-pointer", bigPointer);
    root.style.fontSize = textScale === 1 ? "" : `${Math.round(textScale * 100)}%`;
    root.toggleAttribute("data-low-power", lowPower);
    root.toggleAttribute("data-reduced-motion", reduced);
    root.dataset.theme = theme;
    root.style.setProperty("--color-accent", accent);
    root.style.setProperty("--color-on-accent", textOn(accent));
    root.style.setProperty("--color-accent-fill", fillFor(accent));
  }, [reduced, theme, accent, lowPower, textScale, highContrast, bigPointer]);
}
