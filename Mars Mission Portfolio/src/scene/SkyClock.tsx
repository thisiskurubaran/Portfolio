"use client";

import { useFrame } from "@react-three/fiber";
import { simNow } from "@/state/simClock";
import { updateSky } from "./skyRuntime";

/** Runs before every other frame callback so all objects see the same instant. */
export function SkyClock() {
  useFrame(() => updateSky(simNow()), -100);
  return null;
}
