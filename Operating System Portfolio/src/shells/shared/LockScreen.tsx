"use client";

import { Icon, type IconName } from "@/design/icons";
import { useNotifications } from "@/os/state/notifications";
import { usePreferences } from "@/os/state/preferences";
import { useClock } from "@/os/system/clock";
import { haptic } from "@/os/system/haptics";
import { useSwipe } from "./useSwipe";
import { WeatherText } from "./widgets";

function Shortcut({ label, icon, on, onToggle }: { label: string; icon: IconName; on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        haptic(12);
        onToggle();
      }}
      aria-pressed={on}
      aria-label={label}
      className={`flex h-[52px] w-[52px] items-center justify-center rounded-full transition-colors ${on ? "bg-paper text-ink" : "mat-thin text-paper"}`}
    >
      <Icon name={icon} size={22} weight={2} />
    </button>
  );
}

// F03: the lock screen for folioPhone and folioPad: the real time and local
// weather, waiting notifications, and two shortcuts that work (night light, focus).
export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const now = useClock();
  const waiting = useNotifications((s) => s.items.filter((n) => !n.read).slice(0, 3));
  const { nightLight, focus, update } = usePreferences();
  const unlock = () => {
    haptic();
    onUnlock();
  };
  const swipe = useSwipe((dir) => dir === "up" && unlock());
  const time = now?.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }).replace(/\s?[AP]M/i, "") ?? "";
  return (
    <section {...swipe} aria-label="Lock screen" className="absolute inset-0 z-20 flex touch-none flex-col items-center px-6 pb-6 pt-16 text-center text-white">
      <p className="text-[17px] font-semibold [text-shadow:0_1px_3px_rgb(0_0_0/0.25)]" suppressHydrationWarning>
        {now?.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
      </p>
      <p className="mt-[-4px] text-[min(26vw,6.5rem)] font-bold leading-none tracking-[-0.04em] tabular-nums [text-shadow:0_2px_12px_rgb(0_0_0/0.18)]" suppressHydrationWarning>
        {time}
      </p>
      <p className="mt-3 text-sm font-medium [text-shadow:0_1px_3px_rgb(0_0_0/0.25)]">
        <WeatherText />
      </p>

      {waiting.length > 0 && (
        <ul className="mt-8 w-full max-w-sm space-y-2 text-left">
          {waiting.map((n, i) => (
            <li
              key={n.id}
              className="mat-regular rounded-[20px] px-4 py-3 text-paper"
              style={i > 0 ? { transform: `scale(${1 - i * 0.03})`, opacity: 1 - i * 0.12 } : undefined}
            >
              <p className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-muted">
                folioOS <span className="font-normal normal-case">now</span>
              </p>
              <p className="mt-0.5 text-sm font-semibold">{n.title}</p>
              {n.body && <p className="line-clamp-2 text-[13px] text-muted">{n.body}</p>}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto flex w-full max-w-sm items-end justify-between px-2">
        <Shortcut label="Night light" icon="moon" on={nightLight} onToggle={() => update({ nightLight: !nightLight })} />
        <button onClick={unlock} autoFocus className="flex flex-col items-center gap-2 pb-1 text-[13px] font-medium [text-shadow:0_1px_3px_rgb(0_0_0/0.3)]">
          <span className="folio-nudge">Swipe up to open</span>
        </button>
        <Shortcut label="Focus" icon="bell" on={focus} onToggle={() => update({ focus: !focus })} />
      </div>
      <span aria-hidden className="mt-4 h-[5px] w-36 rounded-full bg-white/80" />
    </section>
  );
}
