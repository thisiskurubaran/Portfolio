// Mirrors the scales in src/app/globals.css for code that needs raw values
// (canvas drawing, inline gradients). Components should prefer the CSS tokens.
export const tokens = {
  system: {
    red: "#ff5a52",
    orange: "#ff9230",
    yellow: "#ffd23f",
    green: "#34d27b",
    mint: "#4ed8c4",
    teal: "#4cc2a8",
    cyan: "#52c6f5",
    blue: "#3d8bff",
    indigo: "#6f6cff",
    purple: "#b26bff",
    pink: "#ff5fa2",
  },
  font: {
    sans: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
    mono: 'ui-monospace, "JetBrains Mono", Menlo, monospace',
  },
  radius: { control: 10, card: 14, window: 14, sheet: 24 },
} as const;

export type Tokens = typeof tokens;
