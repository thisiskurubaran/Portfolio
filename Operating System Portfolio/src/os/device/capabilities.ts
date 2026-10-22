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

// folioVision needs WebGL and a device with some headroom. Anything else gets
// folioDesk, which shows the same content.
export function canRunVision(): VisionCheck {
  if (!hasWebGL()) return { ok: false, reason: "This browser cannot draw 3D, so folioVision fell back to folioDesk." };
  if ((navigator.hardwareConcurrency ?? 8) < 4) return { ok: false, reason: "This device looks too busy for folioVision, so folioDesk opened instead." };
  if (usePower.getState().lowPower) return { ok: false, reason: "Low-power mode is on, so folioVision is skipped for now." };
  return { ok: true };
}

// Worth suggesting folioVision: a roomy screen, a fine pointer and plenty of cores.
export function suitsVision(): boolean {
  return (
    canRunVision().ok &&
    window.innerWidth >= 1200 &&
    window.matchMedia("(pointer: fine)").matches &&
    (navigator.hardwareConcurrency ?? 0) >= 8
  );
}
