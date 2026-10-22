"use client";

import { Suspense, useEffect, useRef } from "react";
import { Skeleton } from "@/os/apps/ui";
import { AppIcon } from "@/design/AppIcon";
import { Icon } from "@/design/icons";
import { appComponents, getApp, type AppId } from "@/os/apps/registry";
import { shareApp } from "@/os/system/share";
import { useFocusTrap } from "@/shells/shared/useFocusTrap";
import { useSwipe } from "@/shells/shared/useSwipe";
import { usePhone } from "./state";

// Apps take the whole screen. The bar at the bottom is the home gesture:
// swipe it up, tap it, or press Escape.
export function AppView({ id }: { id: AppId }) {
  const goHome = usePhone((s) => s.goHome);
  const setOverlay = usePhone((s) => s.setOverlay);
  const app = getApp(id);
  const Content = appComponents[id];
  const ref = useRef<HTMLElement>(null);
  // A long swipe up from the home bar opens the app switcher, a short one goes home.
  const swipe = useSwipe((dir, _start, distance) => {
    if (dir !== "up") return;
    if (distance > window.innerHeight * 0.3) setOverlay("switcher");
    else goHome();
  });
  const trap = useFocusTrap(ref);

  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, [id]);

  if (!app) return null;
  return (
    <section
      ref={ref}
      tabIndex={-1}
      aria-label={app.name}
      onKeyDown={(e) => (e.key === "Escape" ? goHome() : trap(e))}
      className="folio-app-in absolute inset-0 z-10 flex flex-col bg-surface outline-none"
    >
      <div className="h-10 shrink-0 bg-raised" />
      <header className="relative flex h-12 shrink-0 items-center border-b border-line bg-raised px-2">
        <button onClick={goHome} className="flex items-center gap-0.5 rounded-control px-2 py-1 text-sm font-medium text-accent-fg">
          <Icon name="chevron" size={18} className="rotate-180" />
          Home
        </button>
        <h1 className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2 text-[15px] font-semibold">
          <AppIcon id={app.id} icon={app.icon} size={22} />
          {app.name}
        </h1>
        <button onClick={() => void shareApp(id)} aria-label={`Share ${app.name}`} className="ml-auto flex h-9 w-9 items-center justify-center rounded-full text-accent-fg hover:bg-glass">
          <Icon name="share" size={18} />
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-auto overscroll-contain">
        <Suspense fallback={<Skeleton />}>{Content && <Content />}</Suspense>
      </div>
      <button {...swipe} onClick={goHome} aria-label="Go home" className="flex h-8 shrink-0 touch-none items-center justify-center">
        <span aria-hidden className="h-1.5 w-32 rounded-full bg-paper/70" />
      </button>
    </section>
  );
}
