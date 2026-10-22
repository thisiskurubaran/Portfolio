"use client";

import { Icon } from "@/design/icons";
import { getApp } from "@/os/apps/registry";
import { useClock } from "@/os/system/clock";
import { useWindows } from "@/os/state/windows";
import { useNotifications } from "@/os/state/notifications";
import { StatusIcons, WeatherText } from "@/shells/shared/widgets";
import { OnlineCount } from "./Cursors";
import { useDesk } from "./state";

export function MenuBar() {
  const focusedId = useWindows((s) => s.focusedId);
  const appId = useWindows((s) => s.windows.find((w) => w.id === focusedId && !w.minimized)?.appId);
  const toggle = useDesk((s) => s.toggle);
  const unread = useNotifications((s) => s.items.filter((n) => !n.read).length);
  const now = useClock();
  const label = appId ? getApp(appId)?.name : "Desktop";
  return (
    <header className="absolute inset-x-0 top-0 z-[9999] flex h-7 items-center gap-4 bg-ink/60 px-3 text-sm backdrop-blur-md">
      <button onClick={() => toggle("menu")} aria-label="kbOS menu" className="opacity-90 hover:opacity-100">
        <Icon name="logo" size={16} />
      </button>
      <span className="font-medium">{label}</span>
      <span className="ml-auto" />
      <OnlineCount />
      <button onClick={() => toggle("sticky")} title="Leave a sticky note" aria-label="Leave a sticky note" className="opacity-80 hover:opacity-100">
        <Icon name="sticky" size={16} />
      </button>
      <a href="/plain" className="opacity-80 hover:opacity-100">
        Plain view
      </a>
      <button onClick={() => toggle("overview")} aria-label="Show open windows (Ctrl+Up)" title="Open windows (Ctrl+Up)" className="opacity-80 hover:opacity-100">
        <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="3" y="5" width="8" height="6" rx="1.5" />
          <rect x="13" y="5" width="8" height="6" rx="1.5" />
          <rect x="3" y="13" width="8" height="6" rx="1.5" />
          <rect x="13" y="13" width="8" height="6" rx="1.5" />
        </svg>
      </button>
      <button onClick={() => toggle("spotlight")} aria-label="Search (Ctrl+Space)" title="Search (Ctrl+Space or Ctrl+K)" className="opacity-80 hover:opacity-100">
        <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16l4.5 4.5" strokeLinecap="round" />
        </svg>
      </button>
      <span className="opacity-80">
        <WeatherText compact />
      </span>
      <StatusIcons />
      <button
        onClick={() => toggle("center")}
        aria-label={`Notification center${unread ? `, ${unread} unread` : ""}`}
        className="relative tabular-nums opacity-90 hover:opacity-100"
        suppressHydrationWarning
      >
        {now?.toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" })}
        {unread > 0 && <span aria-hidden className="absolute -right-2 top-0 h-1.5 w-1.5 rounded-full bg-accent" />}
      </button>
    </header>
  );
}
