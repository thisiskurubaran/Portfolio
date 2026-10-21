"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, Fog, Vector3 } from "three";
import { useSceneStore } from "@/state/store";
import { CLEAR_NIGHT, weatherToScene, type SceneWeather } from "@/weather/mapping";
import { distanceKm, nearbyQuake } from "@/weather/hazards";
import { isDangerous, PRESETS } from "@/weather/presets";
import { moonPhase } from "@/weather/moon";
import { estimateTide, tideFromData } from "@/weather/tide";
import { SEASON_EFFECTS, seasonAt, type Season } from "@/weather/season";
import { sunFromClock, sunPosition } from "@/weather/sun";
import { compassDirection as directionFor } from "./compass";
import { envRuntime } from "./envRuntime";
import { seaRuntime } from "./seaRuntime";
import { FOG, GLOW_COLOR, MOON_DIR, PALETTES, SEASON_TINT, type SkyPalette } from "./palette";

const UPDATE_EVERY_S = 1;
// Sea state used while a dangerous real storm is near: lively, not dramatic.
const REAL_STORM_SEA = 0.3;
const NEAR_STORM_KM = 600;
const GHOST_UNTIL_HOUR = 4;
// Below this level the rocks around the island show (F06).
export const LOW_TIDE = -0.45;
// Seconds for colours to settle after a change, like the night switch.
const EASE = 1.5;

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function mixPalette(a: SkyPalette, b: SkyPalette, t: number, out: SkyPalette) {
  out.horizon.lerpColors(a.horizon, b.horizon, t);
  out.zenith.lerpColors(a.zenith, b.zenith, t);
  out.seaDeep.lerpColors(a.seaDeep, b.seaDeep, t);
  out.seaCrest.lerpColors(a.seaCrest, b.seaCrest, t);
  out.light.lerpColors(a.light, b.light, t);
}

const blank = (): SkyPalette => ({
  horizon: new Color(),
  zenith: new Color(),
  seaDeep: new Color(),
  seaCrest: new Color(),
  light: new Color(),
});

const target = {
  palette: blank(),
  windDir: new Vector3(0, 0, -1),
  fogNear: FOG.near,
  fogFar: FOG.far,
  rain: 0,
  snow: 0,
  storm: 0,
  tide: 0,
  lightDir: new Vector3(),
  sunDir: new Vector3(),
  glow: 0,
  daylight: 0,
  stars: 1,
  moon: 1,
};
const scratch = blank();
const grey = new Color();

/** Pulls a colour toward its own grey, the way an overcast sky flattens colour. */
function overcast(c: Color, amount: number) {
  const l = c.r * 0.2126 + c.g * 0.7152 + c.b * 0.0722;
  c.lerp(grey.setRGB(l, l, l), amount);
}
const sunKey = new Vector3();

/** Works out the sky for this moment and eases every shared colour toward it. */
export function EnvController() {
  const devHour = useRef<number | null>(null);
  const devSeason = useRef<Season | null>(null);
  const nextUpdate = useRef(0);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    // ?hour=19.5 shows the sky at that local time.
    const h = Number(new URLSearchParams(window.location.search).get("hour"));
    if (new URLSearchParams(window.location.search).has("hour") && Number.isFinite(h)) devHour.current = h;
    // ?season=winter to see a season out of its months.
    const s = new URLSearchParams(window.location.search).get("season");
    if (s === "winter" || s === "spring" || s === "summer" || s === "autumn") devSeason.current = s;
  }, []);

  useFrame(({ clock, scene }, delta) => {
    if (clock.elapsedTime >= nextUpdate.current) {
      nextUpdate.current = clock.elapsedTime + UPDATE_EVERY_S;
      computeTarget(devHour.current, devSeason.current);
    }

    const k = 1 - Math.exp(-EASE * delta);
    const p = target.palette;
    envRuntime.horizon.value.lerp(p.horizon, k);
    envRuntime.zenith.value.lerp(p.zenith, k);
    envRuntime.seaDeep.value.lerp(p.seaDeep, k);
    envRuntime.seaCrest.value.lerp(p.seaCrest, k);
    envRuntime.lightColor.value.lerp(p.light, k);
    envRuntime.lightDir.value.lerp(target.lightDir, k).normalize();
    envRuntime.sunDir.value.lerp(target.sunDir, k).normalize();
    envRuntime.glow.value += (target.glow - envRuntime.glow.value) * k;
    envRuntime.daylight.value += (target.daylight - envRuntime.daylight.value) * k;
    envRuntime.starVisibility.value += (target.stars - envRuntime.starVisibility.value) * k;
    envRuntime.moonVisibility.value += (target.moon - envRuntime.moonVisibility.value) * k;
    envRuntime.fogNear.value += (target.fogNear - envRuntime.fogNear.value) * k;
    envRuntime.fogFar.value += (target.fogFar - envRuntime.fogFar.value) * k;
    envRuntime.rain.value += (target.rain - envRuntime.rain.value) * k;
    envRuntime.snow.value += (target.snow - envRuntime.snow.value) * k;
    envRuntime.storm.value += (target.storm - envRuntime.storm.value) * k;
    // Tides move slowly in life; ease gently so a page load does not show a jump.
    seaRuntime.tide.value += (target.tide - seaRuntime.tide.value) * k * 0.5;
    // Wind swings slowly so waves turn rather than snap.
    const w = seaRuntime.windDir.value;
    w.set(w.x + (target.windDir.x - w.x) * k * 0.3, w.y + (target.windDir.z - w.y) * k * 0.3).normalize();

    // Island, moon and other basic materials use three's own fog.
    if (scene.fog instanceof Fog) {
      scene.fog.color.copy(envRuntime.horizon.value);
      scene.fog.near = envRuntime.fogNear.value;
      scene.fog.far = envRuntime.fogFar.value;
    }
  });

  return null;
}

function computeTarget(devHour: number | null, devSeason: Season | null) {
  const now = new Date();
  if (devHour !== null) now.setHours(Math.floor(devHour), Math.round((devHour % 1) * 60), 0, 0);

  const store = useSceneStore.getState();
  // F26: the small hours of the visitor's own night.
  const ghost = now.getHours() < GHOST_UNTIL_HOUR;
  if (ghost !== store.ghostHour) store.setGhostHour(ghost);
  const { conditions, forceNight, sunUp, setSunUp, seaOverride, seaState, setSeaState, precipOverride } = store;
  const season = devSeason ?? seasonAt(now, conditions?.location?.lat ?? null);
  if (season !== store.season) store.setSeason(season);
  const effects = SEASON_EFFECTS[season];
  const { weather, storm, lightning } = pickWeather(store);
  const loc = conditions?.location;
  const sun = loc ? sunPosition(now, loc.lat, loc.lon) : sunFromClock(now);
  const elevation = forceNight ? -30 : sun.elevation;

  const daylight = smoothstep(-4, 8, elevation);
  // Bell around sunrise and sunset: the pre-dawn glow and the evening colours.
  const twilight = elevation > -14 && elevation < 10 ? Math.exp(-(((elevation + 3) / 5.5) ** 2)) : 0;

  mixPalette(PALETTES.night, PALETTES.day, daylight, scratch);
  mixPalette(scratch, PALETTES.twilight, twilight * 0.85, target.palette);
  if (season === "winter" || season === "summer") {
    const tint = SEASON_TINT[season];
    target.palette.horizon.multiply(tint);
    target.palette.zenith.multiply(tint);
    target.palette.seaDeep.multiply(tint);
  }
  const flatten = weather.cloud * 0.6;
  overcast(target.palette.horizon, flatten);
  overcast(target.palette.zenith, flatten);
  overcast(target.palette.seaDeep, flatten * 0.6);

  directionFor(sun.azimuth, elevation, target.sunDir);
  // Keep the sun a few degrees up as a key light so low sun still glints on the water.
  directionFor(sun.azimuth, Math.max(elevation, 4), sunKey);
  target.lightDir.copy(MOON_DIR).lerp(sunKey, daylight).normalize();

  // Clouds hide the dawn and dusk colours along with the stars and moon.
  target.glow = twilight * (1 - weather.cloud * 0.7);
  target.daylight = daylight;
  target.stars = (1 - smoothstep(-10, -2, elevation)) * (1 - weather.cloud * 0.95);
  target.moon = (1 - daylight * 0.85) * (1 - weather.cloud * 0.8);

  const fog = Math.min(1, weather.fog * effects.fog);
  // Summer haze: the far distance softens even in clear air.
  const haze = season === "summer" ? 0.85 : 1;
  target.fogNear = FOG.near + (2 - FOG.near) * fog;
  target.fogFar = (FOG.far + (55 - FOG.far) * fog) * haze;
  target.storm = storm;
  envRuntime.lightningRate.value = lightning;
  target.rain = precipOverride.rain ?? weather.rain;
  target.snow = precipOverride.snow ?? weather.snow;
  directionFor(weather.waveBearing, 0, target.windDir);

  let sea = seaOverride ?? Math.min(1, weather.seaState * effects.wind);
  // The sensitivity cap has the last word, after any seasonal boost.
  // F34 follows the same rule: no rough water while a strong quake is close by.
  const quake = nearbyQuake(store.hazards, conditions?.location?.lat ?? null, conditions?.location?.lon ?? null);
  const calm = useSceneStore.getState().calmForRealStorm || (!!quake && !store.weatherPreset);
  if (calm) sea = Math.min(sea, REAL_STORM_SEA);
  if (Math.abs(sea - seaState) > 0.001) setSeaState(sea);

  envRuntime.glowColor.value.copy(GLOW_COLOR);
  envRuntime.moonPhase.value = moonPhase(now);

  // F06: real sea level when the marine model covers this coast, else the moon estimate.
  const phase = envRuntime.moonPhase.value;
  const tide =
    (conditions?.tide ? tideFromData(conditions.tide, now.getTime()) : null) ??
    estimateTide(now.getTime(), phase, conditions?.location?.lon ?? null);
  target.tide = store.tideOverride ?? tide.level;
  store.setTide({ rising: tide.rising, estimated: tide.estimated, low: target.tide < LOW_TIDE });

  const up = smoothstep(-4, 8, sun.elevation) > 0.5;
  if (up !== sunUp) setSunUp(up);
}

/**
 * Which weather the scene shows. A barometer choice wins. Otherwise the real
 * weather, except that a dangerous real storm is shown calm (F03 sensitivity
 * rule): drama is only for storms the visitor picks.
 */
function pickWeather(store: ReturnType<typeof useSceneStore.getState>): {
  weather: SceneWeather;
  storm: number;
  lightning: number;
} {
  const chosen = store.weatherPreset ? PRESETS[store.weatherPreset] : null;
  const real = store.conditions?.weather ?? null;
  const loc = store.conditions?.location;
  // F05 feeds the same rule: a live cyclone close by counts as dangerous weather.
  const stormNear =
    !!loc && !!store.hazards?.storms.some((s) => distanceKm(loc.lat, loc.lon, s.lat, s.lon) < NEAR_STORM_KM);
  const dangerous = !chosen && ((real !== null && isDangerous(real)) || stormNear);
  if (dangerous !== store.calmForRealStorm) store.setCalmForRealStorm(dangerous);

  if (chosen) return { weather: chosen, storm: chosen.storm, lightning: chosen.lightning };
  const w = real ? weatherToScene(real) : CLEAR_NIGHT;
  if (dangerous) {
    return { weather: { ...w, seaState: Math.min(w.seaState, REAL_STORM_SEA), rain: w.rain * 0.4, fog: w.fog * 0.5 }, storm: 0, lightning: 0 };
  }
  return { weather: w, storm: 0, lightning: 0 };
}
