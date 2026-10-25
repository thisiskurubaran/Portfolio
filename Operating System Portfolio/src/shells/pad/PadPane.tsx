"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { AppIcon } from "@/design/AppIcon";
import { Icon, type IconName } from "@/design/icons";
import { Skeleton } from "@/os/apps/ui";
import { appComponents, getApp, type AppId } from "@/os/apps/registry";
import { shareApp } from "@/os/system/share";
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
      className="relative flex h-full min-w-0 flex-col overflow-hidden rounded-[22px] bg-surface shadow-3 outline-none ring-1 ring-line"
    >
      <header className="relative flex h-10 shrink-0 items-center justify-center px-3 text-sm">
        <span className="absolute left-3 flex items-center gap-2 text-[13px] font-medium text-muted">
          <AppIcon id={app.id} icon={app.icon} size={18} />
          {app.name}
        </span>
        <button
          onClick={() => setMenu((m) => !m)}
          aria-expanded={menu}
          aria-haspopup="menu"
          aria-label={`${app.name} multitasking options`}
          className={`flex h-6 items-center gap-[5px] rounded-full px-3 transition-colors ${menu ? "bg-accent-fill text-on-accent" : "text-subtle hover:bg-glass-strong hover:text-paper"}`}
        >
          <span aria-hidden className="h-[5px] w-[5px] rounded-full bg-current" />
          <span aria-hidden className="h-[5px] w-[5px] rounded-full bg-current" />
          <span aria-hidden className="h-[5px] w-[5px] rounded-full bg-current" />
        </button>
        <button onClick={() => close(pane)} aria-label={`Close ${app.name}`} className="absolute right-2 flex h-7 w-7 items-center justify-center rounded-full bg-glass text-muted hover:bg-glass-strong hover:text-paper">
          <Icon name="close" size={13} />
        </button>
        {menu && (
          <div role="menu" aria-label="Multitasking" className="mat-chrome folio-pop absolute left-1/2 top-9 z-20 flex -translate-x-1/2 gap-1 rounded-[20px] p-1.5 shadow-3">
            {(
              [
                (pane !== "primary" || secondary) && { label: "Full screen", icon: "maximize", run: () => fullScreen(pane) },
                pane !== "slide" && !compact && { label: "Split view", icon: "windows", run: () => pick("split") },
                pane !== "slide" && { label: "Slide-over", icon: "sidebar", run: () => moveToSlide(pane) },
                { label: "Share", icon: "share", run: () => void shareApp(id) },
                { label: "Close", icon: "close", run: () => close(pane) },
              ].filter(Boolean) as { label: string; icon: IconName; run: () => void }[]
            ).map((a) => (
              <button key={a.label} role="menuitem" onClick={run(a.run)} className="flex w-[72px] flex-col items-center gap-1 rounded-[14px] px-2 py-2 text-[11px] font-medium hover:bg-glass-strong">
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
