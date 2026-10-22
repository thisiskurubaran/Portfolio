"use client";

import { useEffect } from "react";
import { suitsVision } from "@/os/device/capabilities";
import type { Shell } from "@/os/device/resolve";
import { useNotifications } from "@/os/state/notifications";

const INVITED_KEY = "kbos.vision-invite";
const DELAY_MS = 25_000;

// F31: on a capable desktop, suggest kbVision once. Dismissable, never forced.
export function useVisionInvite(shell: Shell | null) {
  useEffect(() => {
    if (shell !== "desk") return;
    let invited = false;
    try {
      invited = window.localStorage.getItem(INVITED_KEY) === "1";
    } catch {
      return;
    }
    if (invited) return;
    const t = window.setTimeout(() => {
      if (!suitsVision()) return;
      try {
        window.localStorage.setItem(INVITED_KEY, "1");
      } catch {
        // ignore
      }
      useNotifications.getState().push("Try kbVision", {
        body: "The same portfolio as floating panels in faked 3D depth. A browser homage to spatial computing, not AR.",
        action: { label: "Open kbVision", shell: "vision" },
      });
    }, DELAY_MS);
    return () => window.clearTimeout(t);
  }, [shell]);
}
