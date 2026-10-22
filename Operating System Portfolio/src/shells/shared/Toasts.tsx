"use client";

import { useEffect } from "react";
import { useNotifications } from "@/os/state/notifications";
import { NotificationCard } from "./NotificationList";

const TOAST_MS = 6000;

function Toast({ id }: { id: number }) {
  const n = useNotifications((s) => s.items.find((i) => i.id === id));
  const dismiss = useNotifications((s) => s.dismissToast);
  useEffect(() => {
    const t = window.setTimeout(() => dismiss(id), TOAST_MS);
    return () => window.clearTimeout(t);
  }, [id, dismiss]);
  if (!n) return null;
  return (
    <div className="pointer-events-auto rounded-2xl border border-line bg-ink/90 shadow-2xl backdrop-blur-2xl">
      <NotificationCard n={n} onAction={() => dismiss(id)} />
    </div>
  );
}

// Banners for new notifications. They also stay in each shell's center or shade.
export function Toasts() {
  const toasts = useNotifications((s) => s.toasts);
  return (
    <div aria-live="polite" className="pointer-events-none fixed right-3 top-10 z-[30000] flex w-[min(360px,calc(100vw-24px))] flex-col gap-2">
      {toasts.map((id) => (
        <Toast key={id} id={id} />
      ))}
    </div>
  );
}
