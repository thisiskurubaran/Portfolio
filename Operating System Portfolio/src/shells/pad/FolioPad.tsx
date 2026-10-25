"use client";

import { useEffect } from "react";
import { AppIcon } from "@/design/AppIcon";
import { getApp } from "@/os/apps/registry";
import { useClock } from "@/os/system/clock";
import { registerLauncher } from "@/os/system/launcher";
import { useWallpaper } from "@/os/system/useSystemAttributes";
import { LockScreen } from "@/shells/shared/LockScreen";
import { Launchpad } from "@/shells/shared/Launchpad";
import { Spotlight } from "@/shells/shared/Spotlight";
import { StatusGlyphs } from "@/shells/shared/StatusGlyphs";
import { TouchControlCenter } from "@/shells/shared/TouchControlCenter";
import { TouchNotificationCenter } from "@/shells/shared/TouchNotificationCenter";
import { useSwipe } from "@/shells/shared/useSwipe";
import { AppPicker } from "./AppPicker";
import { DockPeek, DragLayer } from "./dnd";
import { PadHome } from "./PadHome";
import { SlideOver } from "./SlideOver";
import { SplitView } from "./SplitView";
import { usePad } from "./state";

function StatusBar() {
  const now = useClock();
  const setOverlay = usePad((s) => s.setOverlay);
  const swipe = useSwipe((dir, start) => {
    if (dir === "down") setOverlay(start.x < window.innerWidth / 2 ? "shade" : "control");
  });
  return (
    <div {...swipe} className="relative z-30 flex h-9 shrink-0 touch-none items-center gap-3 px-6 text-[13px] font-semibold [text-shadow:0_1px_2px_rgb(0_0_0/0.15)]">
      <button onClick={() => setOverlay("shade")} aria-label="Open notifications" className="tabular-nums" suppressHydrationWarning>
        {now?.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }).replace(/\s?[AP]M/i, "")}
        <span className="ml-2 font-medium">{now?.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}</span>
      </button>
      <button onClick={() => setOverlay("control")} aria-label="Open control center" className="ml-auto flex items-center">
        <StatusGlyphs />
      </button>
    </div>
  );
}

function Switcher() {
  const { recents, open, setOverlay } = usePad();
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Recent apps"
      onKeyDown={(e) => e.key === "Escape" && setOverlay(null)}
      onClick={(e) => e.target === e.currentTarget && setOverlay(null)}
      className="folio-fade-in absolute inset-0 z-40 flex items-center bg-black/40 px-12 backdrop-blur-2xl"
    >
      {recents.length === 0 ? (
        <p className="w-full text-center text-[15px] text-white/80">No recent apps</p>
      ) : (
        <ul className="mx-auto grid w-full max-w-5xl grid-cols-3 gap-8">
          {recents.map((id) => {
            const app = getApp(id);
            if (!app) return null;
            return (
              <li key={id}>
                <p className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-white">
                  <AppIcon id={app.id} icon={app.icon} size={22} />
                  {app.name}
                </p>
                <button
                  onClick={() => open(id)}
                  autoFocus={id === recents[0]}
                  className="flex aspect-[4/3] w-full items-center justify-center rounded-[26px] bg-ink shadow-3 ring-1 ring-white/10 transition-transform hover:scale-[1.02]"
                >
                  <AppIcon id={app.id} icon={app.icon} size={72} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// folioPad: home screen with a dock, split view and slide-over.
export default function FolioPad() {
  const { primary, overlay, setOverlay, goHome, locked, setLocked } = usePad();
  const wallpaper = useWallpaper();
  const homeBar = useSwipe((dir, _s, distance) => {
    if (dir !== "up") return;
    // Short swipe: the dock peeks up. Longer: home. Longest: recent apps.
    if (distance > window.innerHeight * 0.25) setOverlay("switcher");
    else if (distance < 110) usePad.getState().setDockPeek(true);
    else goHome();
  });

  useEffect(() => {
    usePad.getState().setOverlay(null);
    return registerLauncher((id) => {
      usePad.getState().setLocked(false);
      usePad.getState().open(id);
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.code === "Space" || e.key.toLowerCase() === "k")) {
        e.preventDefault();
        usePad.getState().setOverlay(usePad.getState().overlay === "search" ? null : "search");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const closeOverlay = () => setOverlay(null);
  return (
    <main className="relative flex h-full w-full select-none flex-col overflow-hidden" style={{ background: wallpaper }}>
      <StatusBar />
      {locked ? (
        <LockScreen onUnlock={() => setLocked(false)} />
      ) : (
        <div className="relative min-h-0 flex-1">{primary ? <SplitView /> : <PadHome />}</div>
      )}
      {primary && !locked && (
        <button {...homeBar} onClick={goHome} aria-label="Go home" className="flex h-6 shrink-0 touch-none items-center justify-center">
          <span aria-hidden className="h-[5px] w-44 rounded-full bg-paper/80" />
        </button>
      )}
      {!locked && <SlideOver />}
      {!locked && primary && <DockPeek />}
      <DragLayer />
      {overlay === "picker" && <AppPicker />}
      {overlay === "switcher" && <Switcher />}
      {overlay === "search" && <Spotlight onClose={closeOverlay} />}
      {overlay === "launcher" && <Launchpad onClose={closeOverlay} columns={6} />}
      {overlay === "control" && <TouchControlCenter onClose={closeOverlay} onLock={() => setLocked(true)} onRecents={() => setOverlay("switcher")} />}
      {overlay === "shade" && <TouchNotificationCenter onClose={closeOverlay} />}
    </main>
  );
}
