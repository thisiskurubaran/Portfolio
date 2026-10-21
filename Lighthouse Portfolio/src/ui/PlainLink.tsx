"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ui } from "@/content/ui";

const SETTLE_MS = 10_000;

/**
 * Always visible way out to /plain. Large on first load, so nobody has to
 * hunt for it, then it tucks into the corner once the visitor starts playing.
 */
export function PlainLink() {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    if (compact) return;
    const settle = () => setCompact(true);
    const timer = window.setTimeout(settle, SETTLE_MS);
    const events = ["pointerdown", "wheel", "keydown"] as const;
    // Tab is how keyboard users reach this link, so it should not shrink it.
    const onKey = (e: Event) => {
      if (e instanceof KeyboardEvent && (e.key === "Tab" || e.key === "Shift")) return;
      settle();
    };
    for (const ev of events) window.addEventListener(ev, ev === "keydown" ? onKey : settle, { passive: true });
    return () => {
      window.clearTimeout(timer);
      for (const ev of events) window.removeEventListener(ev, ev === "keydown" ? onKey : settle);
    };
  }, [compact]);

  return (
    <Link href="/plain" className={compact ? "plain-link plain-link-compact" : "plain-link"}>
      {compact ? ui.plainLink.short : ui.plainLink.full}
    </Link>
  );
}
