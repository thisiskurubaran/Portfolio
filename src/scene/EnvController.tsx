"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, Fog, Vector3 } from "three";
import { useSceneStore } from "@/state/store";
import { moonPhase } from "@/weather/moon";
import { sunFromClock, sunPosition } from "@/weather/sun";
import { envRuntime } from "./envRuntime";
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
  lightDir: new Vector3(),
  sunDir: new Vector3(),
  glow: 0,
  daylight: 0,
  stars: 1,
  moon: 1,
};
const scratch = blank();
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

  const { conditions, forceNight, isDay, setIsDay } = useSceneStore.getState();
  const loc = conditions?.location;
  const sun = loc ? sunPosition(now, loc.lat, loc.lon) : sunFromClock(now);
  const elevation = forceNight ? -30 : sun.elevation;

  const daylight = smoothstep(-4, 8, elevation);
  // Bell around sunrise and sunset: the pre-dawn glow and the evening colours.
  const twilight = elevation > -14 && elevation < 10 ? Math.exp(-(((elevation + 3) / 5.5) ** 2)) : 0;

  mixPalette(PALETTES.night, PALETTES.day, daylight, scratch);
  mixPalette(scratch, PALETTES.twilight, twilight * 0.85, target.palette);

  directionFor(sun.azimuth, elevation, target.sunDir);
  // Keep the sun a few degrees up as a key light so low sun still glints on the water.
  directionFor(sun.azimuth, Math.max(elevation, 4), sunKey);
  target.lightDir.copy(MOON_DIR).lerp(sunKey, daylight).normalize();

  target.glow = twilight;
  target.daylight = daylight;
  target.stars = 1 - smoothstep(-10, -2, elevation);
  target.moon = 1 - daylight * 0.85;

  envRuntime.glowColor.value.copy(GLOW_COLOR);
  envRuntime.moonPhase.value = moonPhase(now);
  envRuntime.fogNear.value = FOG.near;
  envRuntime.fogFar.value = FOG.far;

  const day = daylight > 0.5 && !forceNight;
  if (day !== isDay) setIsDay(day);
}
