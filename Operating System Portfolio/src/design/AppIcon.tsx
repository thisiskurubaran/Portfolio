import { Icon, type IconName } from "./icons";

// Each app's tile colours: a light and a deep stop for the gradient, and the
// glyph colour. Original pairings, chosen so every icon is distinct at a glance.
export const appTiles: Record<string, { from: string; to: string; glyph?: string }> = {
  about: { from: "#7f8cff", to: "#4a55d8" },
  experience: { from: "#f7b955", to: "#d9792a" },
  projects: { from: "#5fd6bb", to: "#1f8a74" },
  skills: { from: "#b48cff", to: "#7447d6" },
  certifications: { from: "#ffd36b", to: "#c99317", glyph: "#3b2a05" },
  contact: { from: "#6cc0ff", to: "#2a7bd9" },
  resume: { from: "#ff8f7a", to: "#d84a3a" },
  terminal: { from: "#3a4351", to: "#151a21", glyph: "#6fd3ba" },
  settings: { from: "#a3adbb", to: "#5d6774" },
  photos: { from: "#ff9ec4", to: "#d6457f" },
  browser: { from: "#7ed6ff", to: "#2f8fd1" },
  notes: { from: "#ffe27a", to: "#e3b22c", glyph: "#3d3005" },
  guestbook: { from: "#7fdc8f", to: "#2f9e4b" },
  nets: { from: "#4caf6e", to: "#1d5e38" },
  files: { from: "#8fb4ff", to: "#4b6fd1" },
  calendar: { from: "#ffffff", to: "#e9ecf0", glyph: "#d84a3a" },
  clock: { from: "#2b313b", to: "#0d1015", glyph: "#f6f4ef" },
  calculator: { from: "#ffb15e", to: "#e2701f" },
  editor: { from: "#e8edf3", to: "#b9c3cf", glyph: "#2a3340" },
  activity: { from: "#6fe0a1", to: "#1e9a5a" },
  sysinfo: { from: "#5fd6bb", to: "#186e5d" },
  launcher: { from: "#e9edf2", to: "#aab4c1", glyph: "#28303b" },
};

const fallback = { from: "#8a94a3", to: "#4f5864" };

// An app tile: rounded square, soft vertical gradient, a light top edge for
// depth, and a heavier glyph than the line icons used in chrome.
export function AppIcon({ id, icon, size = 48, className = "" }: { id: string; icon: IconName; size?: number; className?: string }) {
  const tile = appTiles[id] ?? fallback;
  return (
    <span
      aria-hidden
      className={`relative inline-flex shrink-0 items-center justify-center ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.27,
        background: `linear-gradient(160deg, ${tile.from}, ${tile.to})`,
        boxShadow: `inset 0 1px 0 rgb(255 255 255 / 0.35), inset 0 -1px 0 rgb(0 0 0 / 0.15), 0 ${size * 0.06}px ${size * 0.18}px rgb(0 0 0 / 0.25)`,
        color: tile.glyph ?? "#ffffff",
      }}
    >
      <Icon name={icon} size={size * 0.56} weight={size >= 40 ? 2 : 2.2} />
    </span>
  );
}
