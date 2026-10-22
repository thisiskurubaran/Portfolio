"use client";

import { useEffect } from "react";
import { Icon } from "@/design/icons";
import { useNotifications, type Notification } from "@/os/state/notifications";
import { usePreferences } from "@/os/state/preferences";
import { useHandoff } from "@/os/system/handoff";
import { haptic } from "@/os/system/haptics";
import { launch } from "@/os/system/launcher";
import { useSwipe } from "./useSwipe";

export function runAction(n: Notification) {
  if (!n.action) return;
  if (n.action.shell) useHandoff.getState().start(n.action.shell);
  else if (n.action.app) launch(n.action.app);
  else if (n.action.href) window.open(n.action.href, "_blank", "noopener,noreferrer");
}

// Swipe a card sideways to dismiss it, or use the close button.
export function NotificationCard({ n, onAction }: { n: Notification; onAction?: () => void }) {
  const remove = useNotifications((s) => s.remove);
  const swipe = useSwipe((dir) => {
    if (dir !== "left" && dir !== "right") return;
    haptic();
    remove(n.id);
  });
  return (
    <div
      {...swipe}
      className={`touch-pan-y rounded-2xl p-3 ${n.kind === "security" ? "border border-danger/40 bg-danger/15" : "border border-line bg-raised/80"}`}
    >
      <div className="flex items-start gap-2">
        <p className="flex-1 text-sm font-semibold">{n.title}</p>
        <button onClick={() => remove(n.id)} aria-label={`Dismiss ${n.title}`} className="-mr-1 -mt-1 rounded px-1.5 text-muted hover:text-paper">
          ×
        </button>
      </div>
      {n.body && <p className="mt-0.5 text-sm text-muted">{n.body}</p>}
      {n.action && (
        <button
          onClick={() => {
            runAction(n);
            onAction?.();
          }}
          className="mt-2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-on-accent"
        >
          {n.action.label}
        </button>
      )}
    </div>
  );
}

export function NotificationList({ onAction }: { onAction?: () => void }) {
  const items = useNotifications((s) => s.items);
  const clear = useNotifications((s) => s.clear);
  const markAllRead = useNotifications((s) => s.markAllRead);
  const focus = usePreferences((s) => s.focus);

  // Opening the list counts as reading everything in it.
  useEffect(() => {
    markAllRead();
  }, [items.length, markAllRead]);

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium opacity-70">Notifications</h2>
        {items.length > 0 && (
          <button onClick={clear} className="text-xs text-accent-fg">
            Clear all
          </button>
        )}
      </div>
      {focus && (
        <p className="mb-2 flex items-center gap-2 rounded-xl bg-accent/10 px-3 py-2 text-xs text-accent-fg ring-1 ring-accent/25">
          <Icon name="moon" size={14} /> Focus is on. New notifications wait here quietly.
        </p>
      )}
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm opacity-60">No notifications</p>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li key={n.id}>
              <NotificationCard n={n} onAction={onAction} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
