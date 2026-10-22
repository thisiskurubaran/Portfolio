"use client";

import { useEffect, useRef } from "react";
import { AppIcon } from "@/design/AppIcon";
import { getApp, launchable } from "@/os/apps/registry";
import { useFocusTrap } from "@/shells/shared/useFocusTrap";
import { useGridKeys } from "@/shells/shared/useGridKeys";
import { usePad } from "./state";

// Chooses the app for split view or slide-over. Recent apps come first.
export function AppPicker() {
  const { pickerFor, recents, openIn, setOverlay, primary, secondary, slide } = usePad();
  const ref = useRef<HTMLDivElement>(null);
  const trap = useFocusTrap(ref);
  const keys = useGridKeys(6);

  useEffect(() => {
    ref.current?.querySelector<HTMLElement>("button")?.focus();
  }, []);

  if (!pickerFor) return null;
  const busy = [primary, secondary, slide];
  const ordered = [...recents.map(getApp).filter((a) => a && a.load), ...launchable.filter((a) => !recents.includes(a.id))].filter(
    (a, i, list) => a && list.indexOf(a) === i,
  );
  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={pickerFor === "split" ? "Pick an app for split view" : "Pick an app for slide-over"}
      onKeyDown={(e) => {
        if (e.key === "Escape") setOverlay(null);
        else {
          keys(e);
          trap(e);
        }
      }}
      className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-ink/80 p-10 backdrop-blur-2xl"
    >
      <h2 className="mb-6 text-sm opacity-75">{pickerFor === "split" ? "Open beside" : "Open in slide-over"}</h2>
      <div className="grid grid-cols-6 gap-6">
        {ordered.map((app) =>
          app ? (
            <button
              key={app.id}
              disabled={busy.includes(app.id) && pickerFor === "split"}
              onClick={() => openIn(pickerFor === "split" ? "secondary" : "slide", app.id)}
              className="flex flex-col items-center gap-1.5 rounded-xl p-1 disabled:opacity-30"
            >
              <AppIcon id={app.id} icon={app.icon} size={64} />
              <span className="text-xs">{app.name}</span>
            </button>
          ) : null,
        )}
      </div>
      <button onClick={() => setOverlay(null)} className="mt-8 rounded-full bg-glass px-5 py-2 text-sm">
        Cancel
      </button>
    </div>
  );
}
