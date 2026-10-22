import type { Daypart } from "@/os/system/daypart";

export type WallpaperId = "dynamic" | "tide" | "aurora" | "dusk" | "graphite";

type Theme = "light" | "dark";

// A soft colour field: blurred blobs of light over a base gradient. [colour, x%, y%, reach%]
type Blob = [string, number, number, number];

const field = (base: string, blobs: Blob[]) =>
  [...blobs.map(([c, x, y, r]) => `radial-gradient(circle at ${x}% ${y}%, ${c}, transparent ${r}%)`), base].join(", ");

// Fine film grain on top of every wallpaper, so large gradients do not band.
const grain =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0.05 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

// Layered wave ridges for Tide, drawn as an SVG so they stay crisp at any size.
const waves = (fills: [string, string, string]) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 900' preserveAspectRatio='xMidYMax slice'><path fill='${fills[0]}' d='M0 560 C 260 470 520 640 800 560 S 1340 470 1600 540 V900 H0Z'/><path fill='${fills[1]}' d='M0 660 C 300 590 560 730 860 660 S 1380 600 1600 650 V900 H0Z'/><path fill='${fills[2]}' d='M0 760 C 320 710 640 820 960 760 S 1420 720 1600 760 V900 H0Z'/></svg>`,
  )}") bottom / cover no-repeat`;

const fixed: Record<Exclude<WallpaperId, "dynamic">, Record<Theme, string>> = {
  tide: {
    dark: `${waves(["#0f3b44cc", "#12554acc", "#186e5dcc"])}, ${field("linear-gradient(180deg, #08131c, #0b2430)", [["#2fa88e40", 20, 15, 45], ["#3b6fd033", 85, 10, 40]])}`,
    light: `${waves(["#bfe6e0cc", "#9bd8cccc", "#6fc4b4cc"])}, ${field("linear-gradient(180deg, #f2f7f8, #dff0ef)", [["#a9d4f580", 80, 10, 45]])}`,
  },
  aurora: {
    dark: field("linear-gradient(180deg, #05080d, #0c1220)", [["#52c98e55", 25, 30, 40], ["#4cc2a844", 50, 20, 45], ["#a98bf544", 78, 35, 42], ["#3b6fd033", 50, 95, 55]]),
    light: field("linear-gradient(180deg, #f4f7fb, #eaeef8)", [["#9be2cf99", 25, 30, 42], ["#c9b8ff88", 78, 35, 42], ["#a9d4f588", 50, 95, 55]]),
  },
  dusk: {
    dark: field("linear-gradient(170deg, #1a1424, #0b0e12)", [["#e2795b4d", 85, 85, 45], ["#8c4a6e66", 15, 70, 45], ["#4a55d833", 50, 0, 45]]),
    light: field("linear-gradient(170deg, #fbf3ef, #f1ebf5)", [["#f4bfa899", 85, 85, 45], ["#e7cbe099", 15, 70, 45], ["#c9d2e699", 50, 0, 45]]),
  },
  graphite: {
    dark: field("linear-gradient(180deg, #1b1f25, #0b0e12)", [["#ffffff0d", 30, 0, 50], ["#4cc2a814", 80, 100, 50]]),
    light: field("linear-gradient(180deg, #f1f2f4, #e2e5e9)", [["#ffffffaa", 30, 0, 50]]),
  },
};

// The dynamic wallpaper follows the visitor's local time of day.
const daypart: Record<Daypart, Record<Theme, string>> = {
  dawn: {
    dark: field("linear-gradient(170deg, #1b1a2e, #12151f)", [["#f2a65a4d", 20, 85, 45], ["#e573a644", 80, 70, 40], ["#4cc2a822", 50, 10, 50]]),
    light: field("linear-gradient(170deg, #fdf4ec, #f3eef6)", [["#f7d2b4cc", 20, 85, 45], ["#f4c0d1aa", 80, 70, 40], ["#c5eee2aa", 50, 10, 50]]),
  },
  day: {
    dark: field("linear-gradient(170deg, #0f1d2b, #0b1118)", [["#2fa88e4d", 15, 20, 45], ["#3b6fd04d", 85, 30, 45], ["#7f8cff2e", 50, 100, 50]]),
    light: field("linear-gradient(170deg, #eef6fa, #edf1f7)", [["#bfe6e0cc", 15, 20, 45], ["#b5d4f4cc", 85, 30, 45], ["#d9dcffaa", 50, 100, 50]]),
  },
  dusk: fixed.dusk,
  night: {
    dark: field("linear-gradient(170deg, #0a0f18, #070a0f)", [["#4cc2a826", 20, 20, 40], ["#4a55d833", 80, 75, 45], ["#a98bf522", 60, 10, 35]]),
    light: field("linear-gradient(170deg, #e9edf5, #e3e6f0)", [["#c9d2e6cc", 20, 20, 40], ["#d9d3f5aa", 80, 75, 45]]),
  },
};

export interface Wallpaper {
  id: WallpaperId;
  name: string;
}

export const wallpapers: Wallpaper[] = [
  { id: "dynamic", name: "Dynamic" },
  { id: "tide", name: "Tide" },
  { id: "aurora", name: "Aurora" },
  { id: "dusk", name: "Dusk" },
  { id: "graphite", name: "Graphite" },
];

export function wallpaperBackground(id: WallpaperId, theme: Theme, part: Daypart | null) {
  const base = id === "dynamic" ? daypart[part ?? "night"][theme] : (fixed[id] ?? fixed.graphite)[theme];
  return `${grain}, ${base}`;
}

export const accents = ["#4cc2a8", "#6aa8ff", "#f2a65a", "#e573a6", "#a98bf5", "#e5c84b"] as const;
