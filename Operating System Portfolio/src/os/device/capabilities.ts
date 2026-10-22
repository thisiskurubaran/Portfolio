"use client";

import { usePower } from "@/os/system/power";

let webgl: boolean | null = null;

export function hasWebGL(): boolean {
  if (webgl !== null) return webgl;
  try {
    const canvas = document.createElement("canvas");
    webgl = !!(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    webgl = false;
  }
  return webgl;
}

export type VisionCheck = { ok: true } | { ok: false; reason: string };

// kbVision needs WebGL and a device with some headroom. Anything else gets
// kbDesk, which shows the same content.
export function canRunVision(): VisionCheck {
  if (!hasWebGL()) return { ok: false, reason: "This browser cannot draw 3D, so kbVision fell back to kbDesk." };
  if ((navigator.hardwareConcurrency ?? 8) < 4) return { ok: false, reason: "This device looks too busy for kbVision, so kbDesk opened instead." };
  if (usePower.getState().lowPower) return { ok: false, reason: "Low-power mode is on, so kbVision is skipped for now." };
  return { ok: true };
}

// Worth suggesting kbVision: a roomy screen, a fine pointer and plenty of cores.
export function suitsVision(): boolean {
  return (
    canRunVision().ok &&
    window.innerWidth >= 1200 &&
    window.matchMedia("(pointer: fine)").matches &&
    (navigator.hardwareConcurrency ?? 0) >= 8
  );
}
