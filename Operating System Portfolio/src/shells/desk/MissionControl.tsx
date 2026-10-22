"use client";

import { useEffect, useRef } from "react";
import { AppIcon } from "@/design/AppIcon";
import { getApp } from "@/os/apps/registry";
import { desktopOf, DESKTOPS, useWindows } from "@/os/state/windows";
import { useFocusTrap } from "@/shells/shared/useFocusTrap";
import { useGridKeys } from "@/shells/shared/useGridKeys";
import { useDesk } from "./state";

const COLUMNS = 3;

// F07: every open window, minimised ones included, laid out as cards.
export function MissionControl() {
  const allWindows = useWindows((s) => s.windows);
  const currentDesktop = useWindows((s) => s.currentDesktop);
  const setDesktop = useWindows((s) => s.setDesktop);
  const moveToDesktop = useWindows((s) => s.moveToDesktop);
  const windows = allWindows.filter((w) => desktopOf(w) === currentDesktop);
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
      <div role="group" aria-label="Desktops" className="mx-auto mb-8 flex w-fit gap-3">
        {Array.from({ length: DESKTOPS }, (_, i) => i + 1).map((n) => {
          const count = allWindows.filter((w) => desktopOf(w) === n).length;
          return (
            <button
              key={n}
              onClick={() => setDesktop(n)}
              aria-pressed={currentDesktop === n}
              className={`flex h-16 w-28 flex-col items-center justify-center rounded-xl border text-sm transition-colors ${
                currentDesktop === n ? "border-accent bg-accent/15" : "border-line bg-surface/60 hover:bg-surface"
              }`}
            >
              <span className="font-semibold">Desktop {n}</span>
              <span className="text-xs text-muted">{count === 1 ? "1 window" : `${count} windows`}</span>
            </button>
          );
        })}
      </div>
      <h2 className="mb-6 text-center text-sm text-muted">{ordered.length ? `Windows on desktop ${currentDesktop}` : `No windows on desktop ${currentDesktop}`}</h2>
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
              <div className="mt-2 flex justify-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                {Array.from({ length: DESKTOPS }, (_, i) => i + 1)
                  .filter((n) => n !== currentDesktop)
                  .map((n) => (
                    <button key={n} onClick={() => moveToDesktop(win.id, n)} className="rounded-full bg-surface/80 px-2.5 py-0.5 text-xs ring-1 ring-line hover:bg-surface">
                      Move to {n}
                    </button>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
