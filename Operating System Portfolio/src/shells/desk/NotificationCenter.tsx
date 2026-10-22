"use client";

import { useEffect, useRef } from "react";
import { formatDate, useClock } from "@/os/system/clock";
import { NotificationList } from "@/shells/shared/NotificationList";
import { useFocusTrap } from "@/shells/shared/useFocusTrap";
import { WeatherWidget, WorldClockWidget } from "@/shells/shared/widgets";
import { useDesk } from "./state";

// F10 on kbDesk: a panel under the menu bar clock with widgets and notifications.
export function NotificationCenter() {
  const setOverlay = useDesk((s) => s.setOverlay);
  const now = useClock();
  const ref = useRef<HTMLDivElement>(null);
  const trap = useFocusTrap(ref);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <>
      <div className="fixed inset-0 z-[14000]" onClick={() => setOverlay(null)} aria-hidden />
      <aside
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-label="Notification center"
        onKeyDown={(e) => (e.key === "Escape" ? setOverlay(null) : trap(e))}
        className="fixed bottom-24 right-2 top-9 z-[14001] flex w-80 flex-col gap-3 overflow-auto rounded-window border border-line bg-ink/85 p-3 shadow-2xl outline-none backdrop-blur-2xl"
      >
        <p className="px-1 text-sm opacity-75" suppressHydrationWarning>
          {now ? formatDate(now) : ""}
        </p>
        <div className="grid gap-3">
          <WeatherWidget className="!rounded-2xl" />
          <WorldClockWidget className="!rounded-2xl" zones={3} />
        </div>
        <NotificationList onAction={() => setOverlay(null)} />
      </aside>
    </>
  );
}
