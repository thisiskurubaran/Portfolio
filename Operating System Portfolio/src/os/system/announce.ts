"use client";

import { useSyncExternalStore } from "react";

// F31: short spoken updates for screen readers ("Experience opened",
// "Desktop 2"). One polite live region in Boot reads whatever is set here.
let message = "";
const listeners = new Set<() => void>();

export function announce(text: string) {
  // Clearing first makes a repeated message read again.
  message = "";
  listeners.forEach((l) => l());
  window.setTimeout(() => {
    message = text;
    listeners.forEach((l) => l());
  }, 60);
}

export function useAnnouncement() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => message,
    () => "",
  );
}
