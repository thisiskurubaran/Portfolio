"use client";

import { motion, useAnimate } from "framer-motion";
import { Suspense, useEffect, useState, type RefObject } from "react";
import { Icon } from "@/design/icons";
import { appComponents, getApp, type AppId } from "@/os/apps/registry";
import { Skeleton } from "@/os/apps/ui";
import { haptic } from "@/os/system/haptics";
import { shareApp } from "@/os/system/share";
import { useReducedMotion } from "@/os/system/useSystemAttributes";
import { useFocusTrap } from "@/shells/shared/useFocusTrap";
import { useSwipe } from "@/shells/shared/useSwipe";
import { usePhone } from "./state";

const SPRING = { type: "spring", stiffness: 380, damping: 34, mass: 0.9 } as const;

// Apps open out of their icon and shrink back into it. The bar at the bottom
// is the home gesture: swipe it up, tap it, or press Escape.
export function AppView({ id }: { id: AppId }) {
  const goHome = usePhone((s) => s.goHome);
  const setOverlay = usePhone((s) => s.setOverlay);
  const origin = usePhone((s) => s.origin);
  const reduced = useReducedMotion();
  const app = getApp(id);
  const Content = appComponents[id];
  const [scope, animate] = useAnimate<HTMLElement>();
  const [compact, setCompact] = useState(false);
  const trap = useFocusTrap(scope as unknown as RefObject<HTMLElement | null>);

  // The icon's box as a starting point, in the screen's own coordinates.
  const from = origin
    ? { top: origin.y, left: origin.x, width: origin.w, height: origin.h, borderRadius: origin.w * 0.27, opacity: 0.6 }
    : { top: "4%", left: "4%", width: "92%", height: "92%", borderRadius: 40, opacity: 0 };
  const to = { top: 0, left: 0, width: "100%", height: "100%", borderRadius: 0, opacity: 1 };

  const close = async () => {
    haptic();
    if (!reduced && scope.current) await animate(scope.current, { ...from, opacity: origin ? 0.3 : 0 }, { type: "spring", stiffness: 420, damping: 38 });
    goHome();
  };

  // A long swipe up from the home bar opens the app switcher, a short one goes home.
  const swipe = useSwipe((dir, _start, distance) => {
    if (dir !== "up") return;
    if (distance > window.innerHeight * 0.3) setOverlay("switcher");
    else void close();
  });

  useEffect(() => {
    scope.current?.focus({ preventScroll: true });
  }, [id, scope]);

  if (!app) return null;
  return (
    <motion.section
      ref={scope}
      tabIndex={-1}
      aria-label={app.name}
      onKeyDown={(e) => (e.key === "Escape" ? void close() : trap(e))}
      initial={reduced ? to : from}
      animate={to}
      transition={SPRING}
      className="absolute z-10 flex flex-col overflow-hidden bg-ink outline-none"
    >
      <div className={`h-12 shrink-0 transition-colors ${compact ? "mat-chrome" : "bg-ink"}`} />
      <header className={`relative flex h-11 shrink-0 items-center px-2 transition-colors ${compact ? "mat-chrome border-b border-line" : "bg-ink"}`}>
        <button onClick={() => void close()} className="flex items-center gap-0.5 rounded-control px-1.5 py-1 text-[17px] text-accent-fg">
          <Icon name="chevron" size={20} weight={2.2} className="rotate-180" />
          Home
        </button>
        <h1 className={`absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold transition-opacity ${compact ? "opacity-100" : "opacity-0"}`}>{app.name}</h1>
        <button onClick={() => void shareApp(id)} aria-label={`Share ${app.name}`} className="ml-auto flex h-9 w-9 items-center justify-center rounded-full text-accent-fg">
          <Icon name="share" size={20} />
        </button>
      </header>
      <div onScroll={(e) => setCompact(e.currentTarget.scrollTop > 36)} className="phone-app min-h-0 flex-1 overflow-auto overscroll-contain bg-ink">
        <p className="large-title px-5 pb-1 pt-1" aria-hidden={compact}>
          {app.name}
        </p>
        <Suspense fallback={<Skeleton />}>{Content && <Content />}</Suspense>
      </div>
      <button {...swipe} onClick={() => void close()} aria-label="Go home" className="absolute inset-x-0 bottom-0 flex h-7 touch-none items-center justify-center">
        <span aria-hidden className="h-[5px] w-36 rounded-full bg-paper/80" />
      </button>
    </motion.section>
  );
}
