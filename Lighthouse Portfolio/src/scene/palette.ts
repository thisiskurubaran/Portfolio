import { Color, Vector3 } from "three";

export type SkyPalette = {
  horizon: Color;
  zenith: Color;
  seaDeep: Color;
  seaCrest: Color;
  light: Color;
};

const palette = (horizon: string, zenith: string, seaDeep: string, seaCrest: string, light: string): SkyPalette => ({
  horizon: new Color(horizon),
  zenith: new Color(zenith),
  seaDeep: new Color(seaDeep),
  seaCrest: new Color(seaCrest),
  light: new Color(light),
});

// Horizon doubles as the fog colour, so the sea edge always meets the sky.
export const PALETTES = {
  night: palette("#0d1626", "#02040a", "#04101c", "#2a4a66", "#c9d6ea"),
  twilight: palette("#9a5a62", "#1a2242", "#1c1a30", "#6a4c60", "#ffb58a"),
  day: palette("#b8d3e6", "#4a86c5", "#1f5675", "#6aa2c0", "#fff6e0"),
};

/**
 * Seasonal tint multiplied into the sky and sea: colder in winter, a warm
 * haze in summer. Multiplying shifts the hue without lifting a night sky.
 */
export const SEASON_TINT = {
  winter: new Color(0.86, 0.95, 1.12),
  summer: new Color(1.12, 1.02, 0.86),
} as const;

export const SNOW_COLOR = "#e6ecf2";

export const GLOW_COLOR = new Color("#ff9a5a");

export const FOG = { near: 40, far: 260 };

/** Night key light. Fixed so the moon path on the water stays in view. */
export const MOON_DIR = new Vector3(-0.22, 0.26, -0.94).normalize();

/** Static night values, still used for things baked once at load. */
export const NIGHT = {
  horizon: PALETTES.night.horizon,
  moonLight: PALETTES.night.light,
  fogNear: FOG.near,
  fogFar: FOG.far,
};
