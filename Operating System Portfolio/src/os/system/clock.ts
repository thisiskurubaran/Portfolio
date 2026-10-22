"use client";

import { useEffect, useState } from "react";

// Null until mounted so the server render and hydration agree; the visitor's
// own time only exists in the browser.
export function useClock(intervalMs = 15_000) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
export const formatDate = (d: Date) => d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
