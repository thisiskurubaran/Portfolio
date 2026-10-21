import type { SceneWeather } from "./mapping";
import type { Weather } from "./schema";

export type PresetId =
  | "clear"
  | "fog"
  | "rain"
  | "storm"
  | "tropical-storm"
  | "major"
  | "monsoon-squall"
  | "noreaster";

export type Preset = SceneWeather & {
  id: PresetId;
  /** Lightning strikes per minute. */
  lightning: number;
  /** 0 to 1: how stormy the scene feels, for flicker, tossing and rescues. */
  storm: number;
};

const preset = (id: PresetId, w: Omit<Preset, "id" | "waveBearing">): Preset => ({ id, waveBearing: 200, ...w });

// F03 presets plus the plain choices the barometer offers (F18).
// "major" is the hurricane, typhoon or cyclone, named by region at display time.
export const PRESETS: Record<PresetId, Preset> = {
  clear: preset("clear", { seaState: 0.15, fog: 0.03, cloud: 0, rain: 0, snow: 0, lightning: 0, storm: 0 }),
  fog: preset("fog", { seaState: 0.12, fog: 0.85, cloud: 0.6, rain: 0, snow: 0, lightning: 0, storm: 0 }),
  rain: preset("rain", { seaState: 0.35, fog: 0.25, cloud: 0.9, rain: 0.6, snow: 0, lightning: 0, storm: 0.2 }),
  storm: preset("storm", { seaState: 0.7, fog: 0.35, cloud: 1, rain: 0.8, snow: 0, lightning: 6, storm: 0.7 }),
  "tropical-storm": preset("tropical-storm", {
    seaState: 0.78,
    fog: 0.4,
    cloud: 1,
    rain: 0.9,
    snow: 0,
    lightning: 8,
    storm: 0.8,
  }),
  major: preset("major", { seaState: 0.97, fog: 0.45, cloud: 1, rain: 1, snow: 0, lightning: 14, storm: 1 }),
  "monsoon-squall": preset("monsoon-squall", {
    seaState: 0.62,
    fog: 0.5,
    cloud: 1,
    rain: 1,
    snow: 0,
    lightning: 10,
    storm: 0.7,
  }),
  // Cold, snowy, wind off the sea; little lightning.
  noreaster: preset("noreaster", { seaState: 0.82, fog: 0.5, cloud: 1, rain: 0.25, snow: 0.75, lightning: 1, storm: 0.8 }),
};

/**
 * F03 sensitivity rule: weather that could be hurting people near the visitor
 * right now. The scene stays calm for it unless the visitor picks a storm.
 * Gale force wind, damaging gusts or a thunderstorm code.
 */
export function isDangerous(w: Weather): boolean {
  return w.windSpeed >= 62 || w.gusts >= 90 || w.code >= 95;
}
