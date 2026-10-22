"use client";

import { profile } from "@/content";
import { formatDate, formatTime, useClock } from "@/os/system/clock";
import { useSwipe } from "./useSwipe";
import { WeatherText } from "./widgets";

// F03: the lock screen for kbPhone and kbPad, with the real time and local weather.
export function LockScreen({ onUnlock: unlock }: { onUnlock: () => void }) {
  const now = useClock();
  const swipe = useSwipe((dir) => dir === "up" && unlock());
  return (
    <section
      {...swipe}
      aria-label="Lock screen"
      className="absolute inset-0 z-20 flex touch-none flex-col items-center px-6 pb-10 pt-24 text-center"
    >
      <p className="text-lg opacity-80" suppressHydrationWarning>{now ? formatDate(now) : ""}</p>
      <p className="mt-1 text-7xl font-light tabular-nums tracking-tight" suppressHydrationWarning>
        {now ? formatTime(now) : ""}
      </p>
      <p className="mt-3 text-sm">
        <WeatherText />
      </p>
      <p className="mt-6 text-sm opacity-70">{profile.name}</p>
      <button
        onClick={unlock}
        className="mt-auto flex flex-col items-center gap-3 text-sm opacity-80 focus-visible:opacity-100"
        autoFocus
      >
        Swipe up or tap to open
        <span aria-hidden className="h-1.5 w-32 rounded-full bg-paper/70" />
      </button>
    </section>
  );
}
