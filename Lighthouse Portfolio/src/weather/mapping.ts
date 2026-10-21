import type { Weather } from "./schema";

export type SceneWeather = {
  /** 0 calm to 1 hurricane. */
  seaState: number;
  /** Compass bearing the waves travel toward, degrees. */
  waveBearing: number;
  /** 0 clear to 1 thick fog. */
  fog: number;
  /** 0 to 1. */
  cloud: number;
  rain: number;
  snow: number;
};

/** What the scene shows when there is no location or the weather call fails. */
export const CLEAR_NIGHT: SceneWeather = { seaState: 0.2, waveBearing: 200, fog: 0.05, cloud: 0, rain: 0, snow: 0 };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Turns measured weather into scene inputs. The curves are judged by eye:
 * a fresh breeze around 30 km/h reads as a lively sea, gale force wind
 * (60 km/h and up) as rough, and hurricane force as the top of the scale.
 */
export function weatherToScene(w: Weather): SceneWeather {
  const gustExtra = Math.max(0, w.gusts - w.windSpeed) / 300;
  const seaState = clamp01((w.windSpeed / 100) ** 0.85 + gustExtra);

  // Wind direction is where it comes from; waves run the other way.
  const waveBearing = (w.windDirection + 180) % 360;

  // 10 km or more is clear air, 200 m is thick fog, on a log scale like the eye sees it.
  const fog = clamp01(1 - Math.log10(Math.max(w.visibility, 1) / 200) / Math.log10(50));

  return {
    seaState,
    waveBearing,
    fog,
    cloud: clamp01(w.cloudCover),
    // Moderate rain (about 2.5 mm/h) lands near the middle of the scale.
    rain: clamp01(1 - Math.exp(-w.rain / 5)),
    snow: clamp01(1 - Math.exp(-w.snow)),
  };
}
