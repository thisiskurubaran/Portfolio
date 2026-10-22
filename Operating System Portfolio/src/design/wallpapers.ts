import type { Daypart } from "@/os/system/daypart";

export type WallpaperId = "dynamic" | "tide" | "dusk" | "graphite";

export interface Wallpaper {
  id: WallpaperId;
  name: string;
  dark: string;
  light: string;
}

// Original gradients, no image files to download.
export const wallpapers: Wallpaper[] = [
  {
    id: "dynamic",
    name: "Dynamic",
    dark: "linear-gradient(160deg, #10202b, #0e1116 55%, #1b1a2e)",
    light: "linear-gradient(160deg, #dcefe9, #f4f2ed 55%, #e6e1f2)",
  },
  {
    id: "tide",
    name: "Tide",
    dark: "linear-gradient(170deg, #0b3a46, #0e1116 60%, #08222b)",
    light: "linear-gradient(170deg, #bfe6e0, #f4f2ed 60%, #d3ebf0)",
  },
  {
    id: "dusk",
    name: "Dusk",
    dark: "linear-gradient(160deg, #3a1f3d, #1a1424 50%, #0e1116)",
    light: "linear-gradient(160deg, #f6d6cf, #f4f2ed 50%, #e5dcef)",
  },
  {
    id: "graphite",
    name: "Graphite",
    dark: "linear-gradient(180deg, #1c1f24, #0e1116)",
    light: "linear-gradient(180deg, #e9e7e2, #f4f2ed)",
  },
];

// The dynamic wallpaper follows the visitor's local time of day, with a
// variant per theme so text keeps its contrast.
const daypartGradients: Record<Daypart, { dark: string; light: string }> = {
  dawn: {
    dark: "linear-gradient(170deg, #5b3a4a, #2c2840 45%, #12151f)",
    light: "linear-gradient(170deg, #f7d2b4, #f1d9de 45%, #f4f2ed)",
  },
  day: {
    dark: "linear-gradient(170deg, #1d4660, #142a3a 45%, #0e1116)",
    light: "linear-gradient(170deg, #a9d6ec, #d6ebf1 45%, #f4f2ed)",
  },
  dusk: {
    dark: "linear-gradient(170deg, #6a3446, #2e2140 45%, #11131d)",
    light: "linear-gradient(170deg, #f4bfa8, #e7cbe0 45%, #f4f2ed)",
  },
  night: {
    dark: "linear-gradient(170deg, #0b1a2a, #0e1116 50%, #17142a)",
    light: "linear-gradient(170deg, #c9d2e6, #e3e4ee 50%, #f4f2ed)",
  },
};

export function wallpaperBackground(id: WallpaperId, theme: "light" | "dark", daypart: Daypart | null) {
  if (id === "dynamic" && daypart) return daypartGradients[daypart][theme];
  const wp = wallpapers.find((w) => w.id === id) ?? wallpapers[0]!;
  return wp[theme];
}

export const accents = ["#4cc2a8", "#6aa8ff", "#f2a65a", "#e573a6", "#a98bf5", "#e5c84b"] as const;
