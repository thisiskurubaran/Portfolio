"use client";

import { usePreferences } from "@/os/state/preferences";

// F35: a short tap of vibration on gestures, where the browser supports it
// (Android, mostly). Skipped when the visitor asked for less motion.
export function haptic(ms = 8) {
  if (usePreferences.getState().reducedMotion) return;
  try {
    navigator.vibrate?.(ms);
  } catch {
    // Not supported: haptics are a nicety.
  }
}
