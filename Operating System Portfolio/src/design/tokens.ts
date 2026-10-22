export const tokens = {
  color: {
    ink: "#0e1116",
    paper: "#f6f4ef",
    accent: "#4cc2a8",
    glass: "rgb(255 255 255 / 0.08)",
  },
  font: {
    sans: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
    mono: 'ui-monospace, "JetBrains Mono", monospace',
  },
  space: [0, 4, 8, 12, 16, 24, 32, 48, 64] as const,
  radius: { window: 12, control: 8, pill: 999 },
  blur: { glass: 24, low: 0 },
} as const;

export type Tokens = typeof tokens;
