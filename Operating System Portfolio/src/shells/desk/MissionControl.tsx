"use client";

import { useEffect, useRef } from "react";
import { AppIcon } from "@/design/AppIcon";
import { getApp } from "@/os/apps/registry";
import { useWindows } from "@/os/state/windows";
import { useFocusTrap } from "@/shells/shared/useFocusTrap";
import { useGridKeys } from "@/shells/shared/useGridKeys";
import { useDesk } from "./state";

const COLUMNS = 3;

// F07: every open window, minimised ones included, laid out as cards.
export function MissionControl() {
  const windows = useWindows((s) => s.windows);
  const focus = useWindows((s) => s.focus);
  const close = useWindows((s) => s.close);
  const setOverlay = useDesk((s) => s.setOverlay);
  const ref = useRef<HTMLDivElement>(null);
  const trap = useFocusTrap(ref);
  const keys = useGridKeys(COLUMNS);
  const ordered = [...windows].sort((a, b) => b.z - a.z);

  useEffect(() => {
    ref.current?.querySelector<HTMLElement>("button")?.focus();
  }, []);

  const pick = (id: string) => {
    focus(id);
    setOverlay(null);
  };

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label="Open windows"
      onKeyDown={(e) => {
        if (e.key === "Escape") setOverlay(null);
        else {
          keys(e);
          trap(e);
        }
      }}
      onClick={(e) => e.target === e.currentTarget && setOverlay(null)}
      className="fixed inset-0 z-[15000] overflow-auto bg-ink/70 p-10 pt-16 backdrop-blur-xl"
    >
      <h2 className="mb-6 text-center text-sm opacity-70">{ordered.length ? "Open windows" : "No open windows"}</h2>
      <div className="mx-auto grid max-w-5xl grid-cols-3 gap-6">
        {ordered.map((win) => {
          const app = getApp(win.appId);
          if (!app) return null;
          return (
            <div key={win.id} className="group relative">
              <button
                onClick={() => pick(win.id)}
                className="flex aspect-[4/3] w-full flex-col overflow-hidden rounded-window border border-line bg-ink/90 text-left shadow-xl transition-transform hover:scale-[1.03] focus-visible:scale-[1.03]"
              >
                <span className="flex h-8 items-center gap-2 border-b border-line px-3 text-xs">
                  <AppIcon id={app.id} icon={app.icon} size={18} />
                  {app.name}
                  {win.minimized && <span className="ml-auto opacity-60">Minimised</span>}
                </span>
                <span className="flex flex-1 items-center justify-center">
                  <AppIcon id={app.id} icon={app.icon} size={64} />
                </span>
              </button>
              <button
                onClick={() => close(win.id)}
                aria-label={`Close ${app.name}`}
                className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-paper text-xs text-ink opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
