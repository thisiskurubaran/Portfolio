"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { AppIcon } from "@/design/AppIcon";
import { Icon, type IconName } from "@/design/icons";
import { Skeleton } from "@/os/apps/ui";
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
      className="relative flex h-full min-w-0 flex-col overflow-hidden rounded-window border border-line bg-surface shadow-2 outline-none"
    >
      <header className="relative flex h-11 shrink-0 items-center justify-center border-b border-line bg-raised px-3 text-sm">
        <button
          onClick={() => setMenu((m) => !m)}
          aria-expanded={menu}
          aria-haspopup="menu"
          aria-label={`${app.name} multitasking options`}
          className={`absolute left-2 flex h-7 items-center gap-1 rounded-full px-2.5 ${menu ? "bg-accent text-on-accent" : "bg-glass hover:bg-glass-strong"}`}
        >
          <span aria-hidden className="h-1 w-1 rounded-full bg-current" />
          <span aria-hidden className="h-1 w-1 rounded-full bg-current" />
          <span aria-hidden className="h-1 w-1 rounded-full bg-current" />
        </button>
        <span className="flex items-center gap-2 font-semibold">
          <AppIcon id={app.id} icon={app.icon} size={20} />
          {app.name}
        </span>
        <button onClick={() => close(pane)} aria-label={`Close ${app.name}`} className="absolute right-2 flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-glass-strong hover:text-paper">
          <Icon name="close" size={14} />
        </button>
        {menu && (
          <div role="menu" aria-label="Multitasking" className="absolute left-2 top-10 z-20 flex gap-1 rounded-2xl border border-line bg-surface/95 p-1.5 shadow-3 backdrop-blur-2xl">
            {(
              [
                (pane !== "primary" || secondary) && { label: "Full screen", icon: "maximize", run: () => fullScreen(pane) },
                pane !== "slide" && !compact && { label: "Split view", icon: "windows", run: () => pick("split") },
                pane !== "slide" && { label: "Slide-over", icon: "sidebar", run: () => moveToSlide(pane) },
                { label: "Close", icon: "close", run: () => close(pane) },
              ].filter(Boolean) as { label: string; icon: IconName; run: () => void }[]
            ).map((a) => (
              <button key={a.label} role="menuitem" onClick={run(a.run)} className="flex w-20 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium hover:bg-glass-strong">
                <Icon name={a.icon} size={18} />
                {a.label}
              </button>
            ))}
          </div>
        )}
      </header>
      <div className="min-h-0 flex-1 overflow-auto overscroll-contain">
        <Suspense fallback={<Skeleton />}>{Content && <Content />}</Suspense>
      </div>
    </section>
  );
}
