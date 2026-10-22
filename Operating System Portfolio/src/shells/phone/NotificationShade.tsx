"use client";

import { useNotifications } from "@/os/state/notifications";
import { Sheet } from "./Sheet";
import { usePhone } from "./state";

export function NotificationShade() {
  const setOverlay = usePhone((s) => s.setOverlay);
  const items = useNotifications((s) => s.items);
  const clear = useNotifications((s) => s.clear);
  return (
    <Sheet label="Notifications" onClose={() => setOverlay(null)}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium opacity-70">Notifications</h2>
        {items.length > 0 && (
          <button onClick={clear} className="text-xs text-accent-fg">
            Clear all
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm opacity-60">No notifications</p>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li key={n.id} className="rounded-2xl bg-glass p-3">
              <p className="text-sm font-medium">{n.title}</p>
              {n.body && <p className="mt-0.5 text-sm opacity-80">{n.body}</p>}
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
