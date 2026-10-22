"use client";

import { Suspense, useEffect, useRef } from "react";
import { Skeleton } from "@/os/apps/ui";
import { appComponents, getApp, type AppId } from "@/os/apps/registry";
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
      className="folio-app-in absolute inset-0 z-10 flex flex-col bg-ink outline-none"
    >
      <div className="h-10 shrink-0" />
      <header className="flex h-11 shrink-0 items-center border-b border-line px-3">
        <button onClick={goHome} className="rounded-control px-2 py-1 text-sm text-accent-fg">
          Home
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-sm font-medium">{app.name}</h1>
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
