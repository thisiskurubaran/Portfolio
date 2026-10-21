"use client";

import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, BufferAttribute, BufferGeometry, LineBasicMaterial, Vector3 } from "three";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useSceneStore } from "@/state/store";
import { envRuntime } from "./envRuntime";

// Photosensitivity: one pulse per strike and at least this long between
// pulses keeps flashing well under three per second.
const MIN_GAP_S = 0.6;
const RISE_S = 0.04;
const DECAY_S = 0.35;
const SOUND_SPEED = 343;
const SEGMENTS = 14;

const bolt = new BufferGeometry();
bolt.setAttribute("position", new BufferAttribute(new Float32Array((SEGMENTS + 1) * 3), 3));
const boltMaterial = new LineBasicMaterial({
  color: "#e8eeff",
  transparent: true,
  blending: AdditiveBlending,
  depthWrite: false,
  fog: false,
});
const forward = new Vector3();

type Strike = { at: number; distance: number };
const state = { last: -Infinity, strike: null as Strike | null, thunder: [] as { at: number; strength: number }[] };

/** Draws a jagged bolt from the clouds to the sea at a point in front of the camera. */
function shapeBolt(from: Vector3, distance: number) {
  const angle = Math.atan2(forward.x, forward.z) + (Math.random() - 0.5) * 1.2;
  const x = from.x + Math.sin(angle) * distance;
  const z = from.z + Math.cos(angle) * distance;
  const top = 90 + Math.random() * 40;
  const pos = bolt.getAttribute("position") as BufferAttribute;
  let dx = 0;
  let dz = 0;
  for (let i = 0; i <= SEGMENTS; i++) {
    const t = i / SEGMENTS;
    dx += (Math.random() - 0.5) * 9;
    dz += (Math.random() - 0.5) * 9;
    pos.setXYZ(i, x + dx, top * (1 - t), z + dz);
  }
  pos.needsUpdate = true;
  bolt.computeBoundingSphere();
}

/** F03: lightning during storms, with thunder queued for the sound layer. */
export function Lightning() {
  const reducedMotion = useReducedMotion();

  useFrame(({ clock, camera }, delta) => {
    const now = clock.elapsedTime;
    const rate = envRuntime.lightningRate.value;

    if (rate > 0 && now - state.last > MIN_GAP_S && Math.random() < (rate / 60) * delta) {
      state.last = now;
      const distance = 140 + Math.random() * 160;
      state.strike = { at: now, distance };
      camera.getWorldDirection(forward);
      shapeBolt(camera.position, distance);
      // Thunder arrives later the further away the strike is.
      state.thunder.push({ at: now + distance / SOUND_SPEED, strength: 1 - (distance - 140) / 320 });
    }

    while (state.thunder.length && state.thunder[0]!.at <= now) {
      useSceneStore.getState().thunder(state.thunder.shift()!.strength);
    }

    let flash = 0;
    // People who ask for reduced motion get no flashes at all.
    if (state.strike && !reducedMotion) {
      const t = now - state.strike.at;
      flash = t < RISE_S ? t / RISE_S : Math.exp(-(t - RISE_S) / DECAY_S * 3);
      if (t > RISE_S && flash < 0.01) state.strike = null;
    }
    envRuntime.flash.value = flash;
    boltMaterial.opacity = flash > 0.3 ? flash : 0;
  });

  return <lineSegments geometry={bolt} material={boltMaterial} frustumCulled={false} />;
}
