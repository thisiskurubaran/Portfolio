// Mirrors the scales in src/app/globals.css for code that needs raw values
// (canvas drawing, inline gradients). Components should prefer the CSS tokens.
export const tokens = {
  brand: {
    50: "#e8f8f3",
    100: "#c5eee2",
    200: "#9be2cf",
    300: "#6fd3ba",
    400: "#4cc2a8",
    500: "#2fa88e",
    600: "#1f8a74",
    700: "#186e5d",
    800: "#12554a",
    900: "#0b3b33",
  },
  font: {
    sans: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
    display: "var(--font-manrope), var(--font-inter), ui-sans-serif, system-ui, sans-serif",
    mono: 'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, monospace',
  },
  radius: { control: 10, card: 14, window: 14, sheet: 22 },
} as const;

export type Tokens = typeof tokens;
