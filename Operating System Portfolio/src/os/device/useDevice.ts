"use client";

import { useCallback, useSyncExternalStore } from "react";
import { isShell, resolveShell, SHELL_STORAGE_KEY, type Shell } from "./resolve";

const OVERRIDE_EVENT = "kbos:shell-override";

function readOverride(): Shell | null {
  try {
    const value = window.localStorage.getItem(SHELL_STORAGE_KEY);
    return isShell(value) ? value : null;
  } catch {
    return null;
  }
}

// A blocked localStorage means the choice only lasts for this page load.
let memoryOverride: Shell | null = null;

function currentOverride(): Shell | null {
  return readOverride() ?? memoryOverride;
}

function detect(): Shell {
  return resolveShell(
    {
      width: window.innerWidth,
      coarsePointer: window.matchMedia("(pointer: coarse)").matches,
      userAgent: window.navigator.userAgent,
    },
    currentOverride(),
  );
}

function subscribe(onChange: () => void) {
  window.addEventListener("resize", onChange);
  window.addEventListener(OVERRIDE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener("resize", onChange);
    window.removeEventListener(OVERRIDE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

// Returns null on the server and during hydration so both renders agree.
export function useDevice() {
  const shell = useSyncExternalStore<Shell | null>(subscribe, detect, () => null);
  const override = useSyncExternalStore<Shell | null>(subscribe, currentOverride, () => null);

  const setOverride = useCallback((next: Shell | null) => {
    memoryOverride = next;
    try {
      if (next) window.localStorage.setItem(SHELL_STORAGE_KEY, next);
      else window.localStorage.removeItem(SHELL_STORAGE_KEY);
    } catch {
      // Storage blocked, memoryOverride covers this page.
    }
    window.dispatchEvent(new Event(OVERRIDE_EVENT));
  }, []);

  return { shell, override, setOverride };
}
