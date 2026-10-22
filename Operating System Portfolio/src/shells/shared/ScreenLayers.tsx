"use client";

import { usePreferences } from "@/os/state/preferences";
import { useAnnouncement } from "@/os/system/announce";

// F29: brightness is a dimming layer and night light a warm one, both over the
// whole screen and never in the way of clicks.
export function ScreenFilters() {
  const brightness = usePreferences((s) => s.brightness);
  const nightLight = usePreferences((s) => s.nightLight);
  return (
    <>
      {brightness < 1 && <div aria-hidden className="pointer-events-none fixed inset-0 z-[70000] bg-black" style={{ opacity: Math.min(0.6, 1 - brightness) }} />}
      {nightLight && <div aria-hidden className="pointer-events-none fixed inset-0 z-[70001] bg-[#ff9a3c] opacity-[0.14] mix-blend-multiply" />}
    </>
  );
}

// F31: the polite live region that reads announce() messages.
export function Announcer() {
  const message = useAnnouncement();
  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </div>
  );
}
