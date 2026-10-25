import { Icon, type IconName } from "./icons";

// Each app's tile colours: a light and a deep stop for the gradient, and the
// glyph colour. Original pairings, chosen so every icon is distinct at a glance.
export const appTiles: Record<string, { from: string; to: string; glyph?: string }> = {
  about: { from: "#8a8dff", to: "#4f46e5" },
  experience: { from: "#ffb547", to: "#f2711c" },
  projects: { from: "#3ee0b8", to: "#0e9f86" },
  skills: { from: "#c58bff", to: "#7c3aed" },
  certifications: { from: "#ffe066", to: "#f5a524", glyph: "#3b2604" },
  contact: { from: "#5ac8ff", to: "#1d6cf2" },
  resume: { from: "#ff8a7a", to: "#e5382d" },
  terminal: { from: "#3b3f48", to: "#121317", glyph: "#57e3b4" },
  settings: { from: "#b9bec8", to: "#6b717c" },
  photos: { from: "#ffa3cf", to: "#ec3f8c" },
  browser: { from: "#6fdcff", to: "#1f8fe8" },
  notes: { from: "#fff08a", to: "#ffc61a", glyph: "#3d3003" },
  guestbook: { from: "#7ee89a", to: "#21a24a" },
  nets: { from: "#56c77a", to: "#16683a" },
  files: { from: "#7fb2ff", to: "#3767e8" },
  calendar: { from: "#ffffff", to: "#eceef2", glyph: "#e5382d" },
  clock: { from: "#2c2f36", to: "#0b0c0f", glyph: "#ffffff" },
  calculator: { from: "#ffad4a", to: "#f26a12" },
  editor: { from: "#f4f6f9", to: "#c5ccd6", glyph: "#2a3340" },
  activity: { from: "#5ff0a0", to: "#12a356" },
  sysinfo: { from: "#4fe0c6", to: "#0f7f6b" },
  launcher: { from: "#f1f3f6", to: "#b4bcc8", glyph: "#28303b" },
};

const fallback = { from: "#8a94a3", to: "#4f5864" };

// An app tile: rounded square, a vivid vertical gradient, a soft sheen across
// the top and a light edge for depth, with a heavier glyph than chrome icons.
export function AppIcon({ id, icon, size = 48, className = "" }: { id: string; icon: IconName; size?: number; className?: string }) {
  const tile = appTiles[id] ?? fallback;
  return (
    <span
      aria-hidden
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.27,
        background: `linear-gradient(175deg, ${tile.from}, ${tile.to})`,
        boxShadow: `inset 0 1px 0 rgb(255 255 255 / 0.4), inset 0 -1px 1px rgb(0 0 0 / 0.12), 0 ${size * 0.05}px ${size * 0.16}px rgb(0 0 0 / 0.28)`,
        color: tile.glyph ?? "#ffffff",
      }}
    >
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1/2" style={{ background: "linear-gradient(180deg, rgb(255 255 255 / 0.22), transparent)" }} />
      <Icon name={icon} size={size * 0.56} weight={size >= 40 ? 2.1 : 2.3} style={{ filter: "drop-shadow(0 1px 1px rgb(0 0 0 / 0.18))" }} />
    </span>
  );
}
