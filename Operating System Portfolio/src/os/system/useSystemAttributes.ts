"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePreferences } from "@/os/state/preferences";

function mediaStore(query: string) {
  return {
    subscribe: (cb: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    get: () => window.matchMedia(query).matches,
  };
}

const reducedMotionQuery = mediaStore("(prefers-reduced-motion: reduce)");

export function usePrefersReducedMotion() {
  return useSyncExternalStore(reducedMotionQuery.subscribe, reducedMotionQuery.get, () => false);
}

// True when either the OS asks for less motion or the visitor turned it on in kbOS.
export function useReducedMotion() {
  const system = usePrefersReducedMotion();
  const chosen = usePreferences((s) => s.reducedMotion);
  return system || chosen;
}

// Mirrors OS state onto <html> so plain CSS can react without every
// component subscribing to the stores.
export function useSystemAttributes() {
  const reduced = useReducedMotion();
  useEffect(() => {
    document.documentElement.toggleAttribute("data-reduced-motion", reduced);
  }, [reduced]);
}
