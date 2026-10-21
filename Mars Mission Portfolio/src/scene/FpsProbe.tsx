"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useStore } from "@/state/store";

const WARMUP_S = 1.5;
const SAMPLE_S = 3;
const MIN_FPS = 24;
// A longer gap means the tab was hidden or the main thread stalled once;
// counting it would make a fast device look slow.
const MAX_FRAME_S = 0.25;

/** Measures frame rate once after load and suggests the plain site if it is low. */
export function FpsProbe() {
  const s = useRef({ time: 0, frames: 0, done: false });

  useFrame((_, delta) => {
    const p = s.current;
    if (p.done || delta > MAX_FRAME_S) return;
    p.time += delta;
    if (p.time < WARMUP_S) return;
    p.frames++;
    if (p.time >= WARMUP_S + SAMPLE_S) {
      p.done = true;
      if (p.frames / SAMPLE_S < MIN_FPS) useStore.getState().offerPlain("slow");
    }
  });

  return null;
}
