"use client";

import { useClock } from "@/os/system/clock";
import { StatusGlyphs } from "@/shells/shared/StatusGlyphs";
import { useSwipe } from "@/shells/shared/useSwipe";
import { usePhone } from "./state";

// Pull down on the left half for notifications, on the right half for the
// control center. Both halves are buttons too, for anyone not using gestures.
export function StatusBar({ onApp = false }: { onApp?: boolean }) {
  const now = useClock();
  const setOverlay = usePhone((s) => s.setOverlay);
  const swipe = useSwipe((dir, start) => {
    if (dir !== "down") return;
    setOverlay(start.x < window.innerWidth / 2 ? "shade" : "control");
  });
  return (
    <div
      {...swipe}
      className={`relative z-30 flex h-12 shrink-0 touch-none items-center justify-between px-7 pt-1 text-[15px] font-semibold tracking-tight ${onApp ? "" : "[text-shadow:0_1px_2px_rgb(0_0_0/0.2)]"}`}
    >
      <button onClick={() => setOverlay("shade")} aria-label="Open notifications" className="min-w-14 text-left tabular-nums">
        <span suppressHydrationWarning>{now?.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }).replace(/\s?[AP]M/i, "")}</span>
      </button>
      <button onClick={() => setOverlay("control")} aria-label="Open control center" className="flex items-center">
        <StatusGlyphs />
      </button>
    </div>
  );
}
