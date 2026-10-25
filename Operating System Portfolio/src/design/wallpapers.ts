import type { Daypart } from "@/os/system/daypart";

export type WallpaperId = "horizon" | "dynamic" | "ocean" | "sunset" | "aurora" | "graphite";

type Theme = "light" | "dark";

// A colour field: soft pools of light over a base gradient. [colour, x%, y%, reach%]
type Blob = [string, number, number, number];

const field = (base: string, blobs: Blob[]) =>
  [...blobs.map(([c, x, y, r]) => `radial-gradient(ellipse at ${x}% ${y}%, ${c}, transparent ${r}%)`), base].join(", ");

// Fine film grain on top of every wallpaper, so large gradients do not band.
const grain =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0.05 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

// Original multi-colour fields. Dark versions glow out of deep colour; light
// versions are the same hues as pastels.
const sets: Record<Exclude<WallpaperId, "dynamic">, Record<Theme, string>> = {
  horizon: {
    dark: field("linear-gradient(180deg, #0c0a2e 0%, #1c0f42 45%, #2c0e30 100%)", [
      ["#ff7a3ddd", 12, 98, 58],
      ["#e2368fcc", 72, 82, 56],
      ["#5a3dffbb", 82, 12, 52],
      ["#2b6cffaa", 12, 8, 46],
    ]),
    light: field("linear-gradient(180deg, #ebe8ff 0%, #fdeaf3 100%)", [
      ["#ffb38add", 12, 98, 58],
      ["#ff8fc6cc", 74, 82, 56],
      ["#9d8cffcc", 82, 12, 52],
      ["#8fc2ffbb", 12, 8, 46],
    ]),
  },
  ocean: {
    dark: field("linear-gradient(180deg, #02152a 0%, #04304a 100%)", [
      ["#1fb6ffbb", 18, 82, 56],
      ["#19d3b5aa", 82, 88, 52],
      ["#2a4dffbb", 70, 8, 52],
    ]),
    light: field("linear-gradient(180deg, #e4f4ff 0%, #e7fbf6 100%)", [
      ["#8fd6ffcc", 18, 82, 56],
      ["#8ff0dccc", 82, 88, 52],
      ["#a9b8ffcc", 70, 8, 52],
    ]),
  },
  sunset: {
    dark: field("linear-gradient(180deg, #1c0b24 0%, #300d16 100%)", [
      ["#ff7a2fdd", 50, 102, 62],
      ["#ff3d6ecc", 12, 58, 50],
      ["#8a3dffaa", 86, 12, 50],
    ]),
    light: field("linear-gradient(180deg, #fff2e8 0%, #ffe9ee 100%)", [
      ["#ffc08add", 50, 102, 62],
      ["#ff9bb5cc", 12, 58, 50],
      ["#c7a8ffcc", 86, 12, 50],
    ]),
  },
  aurora: {
    dark: field("linear-gradient(180deg, #03060d 0%, #0a1324 100%)", [
      ["#34d27bbb", 26, 32, 42],
      ["#4ed8c4aa", 50, 20, 46],
      ["#b26bffbb", 78, 36, 44],
      ["#3d8bff99", 50, 98, 56],
    ]),
    light: field("linear-gradient(180deg, #f2f8fb 0%, #eceffa 100%)", [
      ["#9ee8c0cc", 26, 32, 42],
      ["#d3b8ffcc", 78, 36, 44],
      ["#a9ccffcc", 50, 98, 56],
    ]),
  },
  graphite: {
    dark: field("linear-gradient(180deg, #1d1d22 0%, #08080a 100%)", [
      ["#ffffff12", 30, 0, 55],
      ["#3d8bff1c", 80, 100, 55],
    ]),
    light: field("linear-gradient(180deg, #f4f4f7 0%, #e3e3e8 100%)", [["#ffffffcc", 30, 0, 55]]),
  },
};

// The dynamic wallpaper moves through the set with the visitor's time of day.
const byDaypart: Record<Daypart, Exclude<WallpaperId, "dynamic">> = {
  dawn: "sunset",
  day: "ocean",
  dusk: "horizon",
  night: "aurora",
};

// Earlier versions had other names; saved choices map to the nearest new one.
const legacy: Record<string, Exclude<WallpaperId, "dynamic">> = { tide: "ocean", dusk: "sunset" };

export interface Wallpaper {
  id: WallpaperId;
  name: string;
}

export const wallpapers: Wallpaper[] = [
  { id: "horizon", name: "Horizon" },
  { id: "dynamic", name: "Dynamic" },
  { id: "ocean", name: "Ocean" },
  { id: "sunset", name: "Sunset" },
  { id: "aurora", name: "Aurora" },
  { id: "graphite", name: "Graphite" },
];

export function wallpaperBackground(id: WallpaperId | string, theme: Theme, part: Daypart | null) {
  const key = id === "dynamic" ? byDaypart[part ?? "night"] : (legacy[id] ?? (id in sets ? (id as Exclude<WallpaperId, "dynamic">) : "horizon"));
  return `${grain}, ${sets[key][theme]}`;
}

// Blue first: the default. Teal is the folioOS brand colour, kept as an option.
export const accents = ["#3d8bff", "#b26bff", "#ff5fa2", "#ff5a52", "#ff9230", "#ffd23f", "#34d27b", "#4cc2a8", "#8e8e96"] as const;
