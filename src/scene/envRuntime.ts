import { Color, Vector3 } from "three";
import { FOG, MOON_DIR, PALETTES } from "./palette";

/**
 * Sky, light and fog as drawn this frame. EnvController eases these toward
 * the time of day and the weather; every shader holds them as uniforms by
 * reference, so one update reaches the sky, sea, ships and stars.
 */
export const envRuntime = {
  horizon: { value: PALETTES.night.horizon.clone() },
  zenith: { value: PALETTES.night.zenith.clone() },
  seaDeep: { value: PALETTES.night.seaDeep.clone() },
  seaCrest: { value: PALETTES.night.seaCrest.clone() },
  /** Key light: the moon at night, the sun by day. */
  lightDir: { value: MOON_DIR.clone() },
  lightColor: { value: PALETTES.night.light.clone() },
  sunDir: { value: new Vector3(0, -1, 0) },
  glowColor: { value: new Color() },
  /** Strength of the warm band around the sun at dawn and dusk. */
  glow: { value: 0 },
  /** 0 night to 1 full day. */
  daylight: { value: 0 },
  starVisibility: { value: 1 },
  moonVisibility: { value: 1 },
  moonPhase: { value: 0.5 },
  fogNear: { value: FOG.near },
  fogFar: { value: FOG.far },
  /** Precipitation, 0 to 1, read by the rain and snow layer. */
  rain: { value: 0 },
  snow: { value: 0 },
  /** F03: 0 calm to 1 full storm. Drives flicker, tossing and rescues. */
  storm: { value: 0 },
  /** Lightning strikes per minute right now. */
  lightningRate: { value: 0 },
  /** Brightness of the current lightning flash, 0 to 1. */
  flash: { value: 0 },
};
