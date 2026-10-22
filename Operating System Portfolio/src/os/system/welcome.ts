"use client";

import { useEffect } from "react";
import type { Shell } from "@/os/device/resolve";
import { useNotifications } from "@/os/state/notifications";

const WELCOMED_KEY = "kbos.welcomed";

const tips: Record<Shell, string> = {
  desk: "Press Ctrl+Space to search anything. Windows drag, resize and snap to the edges.",
  pad: "Use the ••• menu on an app for split view and slide-over.",
  phone: "Pull down from the top right for the control center, and swipe up from the bottom bar to go home.",
  vision: "Click a panel to bring it forward. The depth is faked in the browser, not real AR.",
};

// A one-time hello on the first visit, through the normal notification system.
export function useWelcome(shell: Shell | null) {
  useEffect(() => {
    if (!shell) return;
    let seen = false;
    try {
      seen = window.localStorage.getItem(WELCOMED_KEY) === "1";
      window.localStorage.setItem(WELCOMED_KEY, "1");
    } catch {
      // Blocked storage: greet once per load, which is fine.
    }
    if (seen) return;
    const t = window.setTimeout(() => {
      useNotifications.getState().push("Welcome to kbOS", { body: tips[shell], action: { label: "Open Settings", app: "settings" } });
    }, 1200);
    return () => window.clearTimeout(t);
  }, [shell]);
}
