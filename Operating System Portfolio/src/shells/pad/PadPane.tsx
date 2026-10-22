"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Icon } from "@/design/icons";
import { appComponents, getApp, type AppId } from "@/os/apps/registry";
import { useFocusTrap } from "@/shells/shared/useFocusTrap";
import { usePad, type PadPane as Pane } from "./state";

// One app in a pane. The menu holds the multitasking actions, so split view
// and slide-over work the same with a finger, a pointer or a keyboard.
export function PadPane({ id, pane, compact = false }: { id: AppId; pane: Pane; compact?: boolean }) {
  const app = getApp(id);
  const Content = appComponents[id];
  const [menu, setMenu] = useState(false);
  const { close, fullScreen, moveToSlide, pick, secondary } = usePad();
  const ref = useRef<HTMLElement>(null);
  const trap = useFocusTrap(ref);

  useEffect(() => {
    if (!ref.current?.contains(document.activeElement)) ref.current?.focus({ preventScroll: true });
  }, [id]);

  if (!app) return null;
  const run = (fn: () => void) => () => {
    setMenu(false);
    fn();
  };

  return (
    <section
      ref={ref}
      tabIndex={-1}
      aria-label={app.name}
      onKeyDown={(e) => {
        if (e.key === "Escape" && menu) setMenu(false);
        else trap(e);
      }}
      className="relative flex h-full min-w-0 flex-col overflow-hidden rounded-window border border-line bg-ink outline-none"
    >
      <header className="relative flex h-10 shrink-0 items-center justify-center border-b border-line px-3 text-sm">
        <button
          onClick={() => setMenu((m) => !m)}
          aria-expanded={menu}
          aria-haspopup="menu"
          aria-label={`${app.name} multitasking options`}
          className="absolute left-2 rounded-full px-2 py-0.5 tracking-widest opacity-70 hover:bg-glass hover:opacity-100"
        >
          •••
        </button>
        <span className="flex items-center gap-1.5 font-medium">
          <Icon name={app.icon} size={14} />
          {app.name}
        </span>
        <button onClick={() => close(pane)} aria-label={`Close ${app.name}`} className="absolute right-2 rounded-full px-2 opacity-70 hover:bg-glass hover:opacity-100">
          ×
        </button>
        {menu && (
          <div role="menu" className="absolute left-2 top-9 z-20 w-52 rounded-control border border-line bg-ink p-1 shadow-2xl">
            {(pane !== "primary" || secondary) && (
              <button role="menuitem" onClick={run(() => fullScreen(pane))} className="block w-full rounded px-3 py-2 text-left hover:bg-glass">
                Full screen
              </button>
            )}
            {pane !== "slide" && !compact && (
              <button role="menuitem" onClick={run(() => pick("split"))} className="block w-full rounded px-3 py-2 text-left hover:bg-glass">
                Split view with…
              </button>
            )}
            {pane !== "slide" && (
              <button role="menuitem" onClick={run(() => moveToSlide(pane))} className="block w-full rounded px-3 py-2 text-left hover:bg-glass">
                Move to slide-over
              </button>
            )}
            <button role="menuitem" onClick={run(() => close(pane))} className="block w-full rounded px-3 py-2 text-left hover:bg-glass">
              Close
            </button>
          </div>
        )}
      </header>
      <div className="min-h-0 flex-1 overflow-auto overscroll-contain">
        <Suspense fallback={<p className="p-6 text-sm opacity-60">Loading</p>}>{Content && <Content />}</Suspense>
      </div>
    </section>
  );
}
