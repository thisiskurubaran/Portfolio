"use client";

import { profile } from "@/content";
import { useNotifications } from "@/os/state/notifications";
import { useClock } from "@/os/system/clock";
import { haptic } from "@/os/system/haptics";
import { useSwipe } from "./useSwipe";
import { WeatherText } from "./widgets";

// F03: the lock screen for folioPhone and folioPad, with the real time, the
// local weather and a peek at waiting notifications.
export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const now = useClock();
  const waiting = useNotifications((s) => s.items.filter((n) => !n.read).slice(0, 2));
  const unlock = () => {
    haptic();
    onUnlock();
  };
  const swipe = useSwipe((dir) => dir === "up" && unlock());
  const [time, meridiem] = now ? now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }).split(" ") : ["", ""];
  return (
    <section {...swipe} aria-label="Lock screen" className="absolute inset-0 z-20 flex touch-none flex-col items-center px-6 pb-8 pt-20 text-center">
      <p className="text-base font-medium text-paper/85" suppressHydrationWarning>
        {now?.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
      </p>
      <p className="font-display text-[min(22vw,6rem)] font-bold leading-none tracking-tight tabular-nums" suppressHydrationWarning>
        {time}
        {meridiem && <span className="ml-1 align-top text-[0.28em] font-semibold text-paper/70">{meridiem}</span>}
      </p>
      <p className="mt-3 rounded-full bg-glass px-3 py-1 text-sm backdrop-blur-xl">
        <WeatherText />
      </p>

      {waiting.length > 0 && (
        <ul className="mt-8 w-full max-w-sm space-y-2 text-left">
          {waiting.map((n) => (
            <li key={n.id} className="rounded-2xl border border-line bg-surface/70 px-4 py-3 shadow-2 backdrop-blur-2xl">
              <p className="text-sm font-semibold">{n.title}</p>
              {n.body && <p className="line-clamp-2 text-xs text-muted">{n.body}</p>}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-auto text-xs text-paper/70">{profile.name}&apos;s folioPhone</p>
      <button onClick={unlock} autoFocus className="mt-3 flex flex-col items-center gap-3 text-sm font-medium">
        <span className="folio-nudge">Swipe up or tap to open</span>
        <span aria-hidden className="h-1.5 w-32 rounded-full bg-paper/70" />
      </button>
    </section>
  );
}
