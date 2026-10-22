"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/design/icons";
import { getApp } from "@/os/apps/registry";
import { useWindows } from "@/os/state/windows";

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function MenuBar() {
  const focusedId = useWindows((s) => s.focusedId);
  const appId = useWindows((s) => s.windows.find((w) => w.id === focusedId)?.appId);
  const now = useClock();
  const label = appId ? getApp(appId)?.name : "Desktop";
  return (
    <header className="absolute inset-x-0 top-0 z-[9999] flex h-7 items-center gap-4 bg-ink/60 px-3 text-sm backdrop-blur-md">
      <Icon name="logo" size={16} aria-label="kbOS" />
      <span className="font-medium">{label}</span>
      <span className="ml-auto tabular-nums opacity-80" suppressHydrationWarning>
        {now?.toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" })}
      </span>
    </header>
  );
}
