"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/design/icons";
import { useNotifications, type Notification } from "@/os/state/notifications";
import { usePreferences } from "@/os/state/preferences";
import { useClock } from "@/os/system/clock";
import { haptic } from "@/os/system/haptics";
import { runAction } from "./NotificationList";
import { useFocusTrap } from "./useFocusTrap";
import { useSwipe } from "./useSwipe";

const ago = (at: number) => {
  const m = Math.floor((Date.now() - at) / 60000);
  return m < 1 ? "now" : m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ago`;
};

function Card({ n, onAction }: { n: Notification; onAction: () => void }) {
  const remove = useNotifications((s) => s.remove);
  const swipe = useSwipe((dir) => {
    if (dir !== "left" && dir !== "right") return;
    haptic();
    remove(n.id);
  });
  return (
    <div {...swipe} className={`mat-regular touch-pan-y rounded-[22px] px-4 py-3 text-paper ${n.kind === "security" ? "ring-1 ring-sys-red/60" : ""}`}>
      <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-muted">
        <span className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${n.kind === "security" ? "bg-sys-red" : "bg-accent"}`} />
          {n.kind === "security" ? "Firewall" : "folioOS"}
        </span>
        <span className="font-normal normal-case">{ago(n.at)}</span>
      </div>
      <p className="mt-1 text-[15px] font-semibold">{n.title}</p>
      {n.body && <p className="text-[14px] leading-snug text-muted">{n.body}</p>}
      {n.action && (
        <button
          onClick={() => {
            runAction(n);
            onAction();
          }}
          className="mt-2 rounded-full bg-accent-fill px-3 py-1 text-[13px] font-semibold text-on-accent"
        >
          {n.action.label}
        </button>
      )}
    </div>
  );
}

// The notification center for the touch shells: the date, then notifications
// stacked; past three they collapse into a stack that expands on tap.
export function TouchNotificationCenter({ onClose }: { onClose: () => void }) {
  const items = useNotifications((s) => s.items);
  const clear = useNotifications((s) => s.clear);
  const markAllRead = useNotifications((s) => s.markAllRead);
  const focus = usePreferences((s) => s.focus);
  const now = useClock();
  const [expanded, setExpanded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const trap = useFocusTrap(ref);
  const swipe = useSwipe((dir) => dir === "up" && onClose());

  useEffect(() => {
    ref.current?.focus();
    markAllRead();
  }, [markAllRead]);

  const shown = expanded ? items : items.slice(0, 3);
  const hidden = items.length - shown.length;
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Notifications"
      {...swipe}
      onKeyDown={(e) => (e.key === "Escape" ? onClose() : trap(e))}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="folio-fade-in absolute inset-0 z-[12000] overflow-y-auto bg-black/35 px-4 pb-10 pt-14 text-white outline-none backdrop-blur-2xl backdrop-saturate-150"
    >
      <div className="mx-auto max-w-sm">
        <p className="text-center text-[17px] font-semibold" suppressHydrationWarning>
          {now?.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <p className="text-center text-[64px] font-bold leading-none tracking-[-0.04em] tabular-nums" suppressHydrationWarning>
          {now?.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }).replace(/\s?[AP]M/i, "")}
        </p>

        <div className="mb-2 mt-8 flex items-center justify-between px-1">
          <h2 className="text-[20px] font-bold">Notifications</h2>
          {items.length > 0 && (
            <button onClick={clear} aria-label="Clear all notifications" className="mat-thin flex h-7 items-center gap-1 rounded-full px-3 text-[13px] font-semibold text-paper">
              <Icon name="close" size={12} weight={2.4} /> Clear
            </button>
          )}
        </div>
        {focus && (
          <p className="mat-thin mb-2 flex items-center gap-2 rounded-2xl px-3 py-2 text-[13px] text-paper">
            <Icon name="moon" size={14} /> Focus is on. New notifications wait here quietly.
          </p>
        )}
        {items.length === 0 ? (
          <p className="py-10 text-center text-[15px] text-white/70">No notifications</p>
        ) : (
          <ul className="space-y-2">
            {shown.map((n) => (
              <li key={n.id}>
                <Card n={n} onAction={onClose} />
              </li>
            ))}
            {hidden > 0 && (
              <li>
                <button onClick={() => setExpanded(true)} className="mat-thin w-full rounded-[22px] py-2 text-[13px] font-semibold text-paper">
                  {hidden} more
                </button>
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
