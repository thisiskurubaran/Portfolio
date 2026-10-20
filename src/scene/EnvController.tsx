"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, Fog, Vector3 } from "three";
import { useSceneStore } from "@/state/store";
import { CLEAR_NIGHT, weatherToScene } from "@/weather/mapping";
import { moonPhase } from "@/weather/moon";
import { sunFromClock, sunPosition } from "@/weather/sun";
import { envRuntime } from "./envRuntime";
import { seaRuntime } from "./seaRuntime";
import { FOG, GLOW_COLOR, MOON_DIR, PALETTES, type SkyPalette } from "./palette";

const RAD = Math.PI / 180;
const UPDATE_EVERY_S = 1;
// Seconds for colours to settle after a change, like the night switch.
const EASE = 1.5;

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * World direction for a compass bearing. The camera looks along -Z, which is
 * treated as south, so a northern hemisphere sun crosses the view and sets to
 * the right.
 */
function directionFor(azimuth: number, elevation: number, out: Vector3): Vector3 {
  const a = azimuth * RAD;
  const e = elevation * RAD;
  return out.set(-Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e));
}

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
  const nextUpdate = useRef(0);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    // ?hour=19.5 shows the sky at that local time.
    const h = Number(new URLSearchParams(window.location.search).get("hour"));
    if (new URLSearchParams(window.location.search).has("hour") && Number.isFinite(h)) devHour.current = h;
  }, []);

  useFrame(({ clock, scene }, delta) => {
    if (clock.elapsedTime >= nextUpdate.current) {
      nextUpdate.current = clock.elapsedTime + UPDATE_EVERY_S;
      computeTarget(devHour.current);
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

function computeTarget(devHour: number | null) {
  const now = new Date();
  if (devHour !== null) now.setHours(Math.floor(devHour), Math.round((devHour % 1) * 60), 0, 0);

  const { conditions, forceNight, sunUp, setSunUp, seaOverride, seaState, setSeaState } = useSceneStore.getState();
  const weather = conditions?.weather ? weatherToScene(conditions.weather) : CLEAR_NIGHT;
  const loc = conditions?.location;
  const sun = loc ? sunPosition(now, loc.lat, loc.lon) : sunFromClock(now);
  const elevation = forceNight ? -30 : sun.elevation;

  const daylight = smoothstep(-4, 8, elevation);
  // Bell around sunrise and sunset: the pre-dawn glow and the evening colours.
  const twilight = elevation > -14 && elevation < 10 ? Math.exp(-(((elevation + 3) / 5.5) ** 2)) : 0;

  mixPalette(PALETTES.night, PALETTES.day, daylight, scratch);
  mixPalette(scratch, PALETTES.twilight, twilight * 0.85, target.palette);
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

  target.fogNear = FOG.near + (2 - FOG.near) * weather.fog;
  target.fogFar = FOG.far + (55 - FOG.far) * weather.fog;
  target.rain = weather.rain;
  target.snow = weather.snow;
  directionFor(weather.waveBearing, 0, target.windDir);

  const sea = seaOverride ?? weather.seaState;
  if (Math.abs(sea - seaState) > 0.001) setSeaState(sea);

  envRuntime.glowColor.value.copy(GLOW_COLOR);
  envRuntime.moonPhase.value = moonPhase(now);

  const up = smoothstep(-4, 8, sun.elevation) > 0.5;
  if (up !== sunUp) setSunUp(up);
}
