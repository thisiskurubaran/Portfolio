"use client";

import { useEffect, useState } from "react";
import { LogoMark } from "@/design/Logo";
import { formatDate, formatTime, useClock } from "@/os/system/clock";
import { useReducedMotion } from "@/os/system/useSystemAttributes";

const IDLE_MS = 3 * 60_000;
const EVENTS = ["pointermove", "pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const;

function Saver() {
  const now = useClock(10_000);
  const reduced = useReducedMotion();
  return (
    <div aria-label="Screensaver. Move or press any key to return." role="dialog" className="fixed inset-0 z-[50000] cursor-none overflow-hidden bg-[#05070a] text-[#f6f4ef]">
      <div className={`absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-3 ${reduced ? "" : "folio-drift"}`}>
        <LogoMark size={40} className="opacity-80" />
        <p className="text-7xl font-extralight tabular-nums" suppressHydrationWarning>
          {now ? formatTime(now) : ""}
        </p>
        <p className="opacity-60" suppressHydrationWarning>
          {now ? formatDate(now) : ""}
        </p>
      </div>
    </div>
  );
}

// F34: after a few idle minutes, a calm clock. Any input brings folioOS back.
export function Screensaver() {
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    let timer = window.setTimeout(() => setIdle(true), IDLE_MS);
    const wake = () => {
      setIdle(false);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setIdle(true), IDLE_MS);
    };
    EVENTS.forEach((e) => window.addEventListener(e, wake, { passive: true, capture: true }));
    return () => {
      window.clearTimeout(timer);
      EVENTS.forEach((e) => window.removeEventListener(e, wake, { capture: true }));
    };
  }, []);
  return idle ? <Saver /> : null;
}
