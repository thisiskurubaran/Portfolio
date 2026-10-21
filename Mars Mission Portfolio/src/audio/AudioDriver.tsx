"use client";

import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import { base, deepDives } from "@/content/surface";
import { EVENTS } from "@/scene/launch/ascentProfile";
import { local } from "@/scene/localRuntime";
import { ascent } from "@/scene/missionRuntime";
import { GROUND_Y } from "@/scene/surface/Surface";
import { driveInput, roverState, TILT_WARN_DEG } from "@/scene/surface/roverState";
import { surface } from "@/scene/surfaceRuntime";
import { useStore } from "@/state/store";
import { breathe, click, glide, heartbeat, ping } from "./engine";
import { captions, sound } from "./sound";

const INSIDE = new Set(["countdown", "ascent", "orbit", "tmi", "transit", "capture", "marsOrbit", "descent"]);
/** Third voice of the cruise score: notes of A major pentatonic, changed slowly. */
const SCORE_NOTES = [220, 246.94, 277.18, 329.63, 369.99];

const timers = { click: 0, breath: 0, beat: 0, ping: 0, note: 0 };
const fwd = new Vector3();
const up = new Vector3();

function caption(id: string, on: boolean): void {
  if (on) captions.add(id);
  else captions.delete(id);
}

/**
 * Sets every sound from the scene state each frame. Nothing here is
 * scripted: engine noise follows thrust and air density, the rover motor
 * follows wheel speed, and the listener is the camera.
 */
export function AudioDriver() {
  useFrame(({ camera }, delta) => {
    const g = sound.graph;
    if (!g || !sound.on) return;
    const ctx = g.ctx;
    const { phase, transitMode } = useStore.getState();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const now = ctx.currentTime;

    const l = ctx.listener;
    camera.getWorldDirection(fwd);
    up.set(0, 1, 0).applyQuaternion(camera.quaternion);
    l.positionX.value = camera.position.x;
    l.positionY.value = camera.position.y;
    l.positionZ.value = camera.position.z;
    l.forwardX.value = fwd.x;
    l.forwardY.value = fwd.y;
    l.forwardZ.value = fwd.z;
    l.upX.value = up.x;
    l.upY.value = up.y;
    l.upZ.value = up.z;

    // Thrust. On the ascent the roar is carried by air and thins with it;
    // above the atmosphere only the hull-borne rumble is left.
    const t = ascent.t;
    const ascentBurn = phase === "ascent" && t >= 0 && t < EVENTS.seco && !(t > EVENTS.meco && t < EVENTS.secondStageIgnition);
    const burning = ascentBurn || phase === "tmi" || local.engineBurn;
    const air = phase === "ascent" ? local.air.value : 0;
    const calm = reduced ? 0.5 : 1;
    glide(g.roar.gain.gain, ascentBurn ? 0.6 * Math.sqrt(air) * calm : 0, ctx, 0.3);
    // Crackle flutters: shock cells in the plume, loudest near the ground.
    glide(g.crackle.gain.gain, ascentBurn ? 0.12 * air * (0.4 + Math.random()) * calm : 0, ctx, 0.03);
    // Entry buffeting reaches the crew through the structure too.
    const entry = phase === "descent" && surface.altitudeKm > 10 && surface.altitudeKm < 120;
    glide(g.hull.gain.gain, burning ? 0.45 * calm : entry ? 0.3 * calm : 0, ctx, 0.25);
    caption("engine", burning);
    caption("entry", entry);

    const inside = INSIDE.has(phase);
    glide(g.fans.gain.gain, inside ? 0.035 : 0, ctx, 1);
    glide(g.hum.gain.gain, inside ? 0.008 : 0, ctx, 1);
    caption("ship", inside);
    timers.click -= delta;
    if (inside && timers.click <= 0) {
      click(g);
      timers.click = 6 + Math.random() * 14;
    }

    const cruise = phase === "transit" && transitMode === "cruise";
    glide(g.score.gain.gain, cruise ? 0.02 : 0, ctx, 3);
    caption("score", cruise);
    timers.note -= delta;
    if (cruise && timers.note <= 0) {
      g.score.oscs[2]!.frequency.setTargetAtTime(
        SCORE_NOTES[Math.floor(Math.random() * SCORE_NOTES.length)]!,
        now,
        2,
      );
      timers.note = 16 + Math.random() * 10;
    }

    // On the surface: the suit, the rover and the beacons.
    const onSurface = phase === "surface";
    const stressed = onSurface && roverState.tiltDeg >= TILT_WARN_DEG;
    caption("breath", onSurface);
    caption("heart", stressed && !reduced);
    timers.breath -= delta;
    if (onSurface && timers.breath <= 0) {
      const period = stressed ? 3 : 4.6;
      breathe(g, period, 0.05);
      timers.breath = period;
    }
    timers.beat -= delta;
    if (stressed && !reduced && timers.beat <= 0) {
      heartbeat(g);
      timers.beat = 60 / 105;
    }

    const speed = Math.abs(roverState.speed);
    const driving = onSurface && (speed > 0.1 || driveInput.throttle !== 0);
    glide(g.motor.gain.gain, driving ? 0.05 + Math.min(speed / 4, 1) * 0.06 : 0, ctx, 0.2);
    glide(g.motor.osc.frequency, 45 + speed * 30, ctx, 0.2);
    const p = g.motor.panner;
    p.positionX.value = surface.rover.x;
    p.positionY.value = surface.rover.y + GROUND_Y;
    p.positionZ.value = surface.rover.z;
    caption("motor", driving);

    const near = roverState.nearest;
    timers.ping -= delta;
    if (onSurface && near && near.d < 120 && timers.ping <= 0) {
      const at = near.id === "base" ? base.at : deepDives.find((d) => d.id === near.id)?.at;
      if (at) {
        g.ping.panner.positionX.value = at.x;
        g.ping.panner.positionY.value = GROUND_Y + 5;
        g.ping.panner.positionZ.value = at.z;
        ping(g);
      }
      timers.ping = 3;
    }
    caption("ping", onSurface && !!near && near.d < 120);
  });
  return null;
}
