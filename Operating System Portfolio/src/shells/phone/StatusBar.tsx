"use client";

import { formatTime, useClock } from "@/os/system/clock";
import { useSwipe } from "@/shells/shared/useSwipe";
import { StatusIcons } from "@/shells/shared/widgets";
import { usePhone } from "./state";

// Pull down on the left half for notifications, on the right half for the
// control center. Both also have a button for anyone not using gestures.
export function StatusBar() {
  const now = useClock();
  const setOverlay = usePhone((s) => s.setOverlay);
  const swipe = useSwipe((dir, start) => {
    if (dir !== "down") return;
    setOverlay(start.x < window.innerWidth / 2 ? "shade" : "control");
  });
  return (
    <div {...swipe} className="relative z-30 flex h-10 shrink-0 touch-none items-center justify-between px-5 text-sm font-medium">
      <button onClick={() => setOverlay("shade")} aria-label="Open notifications" className="tabular-nums">
        <span suppressHydrationWarning>{now ? formatTime(now) : ""}</span>
      </button>
      <button onClick={() => setOverlay("control")} aria-label="Open control center" className="flex items-center gap-1 opacity-90">
        <StatusIcons />
        <span aria-hidden className="ml-1 text-base leading-none">⌄</span>
      </button>
    </div>
  );
}
