"use client";

import { useEffect } from "react";
import { Icon } from "@/design/icons";
import { getApp } from "@/os/apps/registry";
import { formatTime, useClock } from "@/os/system/clock";
import { registerLauncher } from "@/os/system/launcher";
import { useWallpaper } from "@/os/system/useSystemAttributes";
import { NotificationList } from "@/shells/shared/NotificationList";
import { QuickSettings } from "@/shells/shared/QuickSettings";
import { Sheet } from "@/shells/shared/Sheet";
import { Spotlight } from "@/shells/shared/Spotlight";
import { useSwipe } from "@/shells/shared/useSwipe";
import { AppPicker } from "./AppPicker";
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
    <div {...swipe} className="relative z-30 flex h-8 shrink-0 touch-none items-center gap-4 px-6 text-sm font-medium">
      <button onClick={() => setOverlay("shade")} aria-label="Open notifications" className="tabular-nums">
        <span suppressHydrationWarning>{now ? formatTime(now) : ""}</span>
      </button>
      <button onClick={() => setOverlay("search")} aria-label="Search (Ctrl+Space)" className="ml-auto opacity-80">
        <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16l4.5 4.5" strokeLinecap="round" />
        </svg>
      </button>
      <button onClick={() => setOverlay("control")} aria-label="Open control center" className="opacity-80">
        <span aria-hidden className="block h-2.5 w-4 rounded-sm border border-current" />
      </button>
    </div>
  );
}

function Switcher() {
  const { recents, open, setOverlay } = usePad();
  return (
    <div role="dialog" aria-modal="true" aria-label="Recent apps" onKeyDown={(e) => e.key === "Escape" && setOverlay(null)} className="absolute inset-0 z-40 bg-ink/75 p-12 backdrop-blur-2xl">
      <h2 className="mb-6 text-center text-sm opacity-75">{recents.length ? "Recent apps" : "No recent apps"}</h2>
      <ul className="mx-auto grid max-w-4xl grid-cols-3 gap-6">
        {recents.map((id) => {
          const app = getApp(id);
          if (!app) return null;
          return (
            <li key={id}>
              <button onClick={() => open(id)} autoFocus={id === recents[0]} className="flex aspect-[4/3] w-full flex-col overflow-hidden rounded-window border border-line bg-ink text-left shadow-xl">
                <span className="flex items-center gap-2 border-b border-line p-2 text-xs">
                  <Icon name={app.icon} size={14} />
                  {app.name}
                </span>
                <span className="flex flex-1 items-center justify-center opacity-30">
                  <Icon name={app.icon} size={48} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// kbPad: home screen with a dock, split view and slide-over.
export default function KbPad() {
  const { primary, overlay, setOverlay, goHome } = usePad();
  const wallpaper = useWallpaper();
  const homeBar = useSwipe((dir, _s, distance) => {
    if (dir !== "up") return;
    if (distance > window.innerHeight * 0.25) setOverlay("switcher");
    else goHome();
  });

  useEffect(() => registerLauncher((id) => usePad.getState().open(id)), []);

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
    <main className="relative flex h-dvh w-screen select-none flex-col overflow-hidden" style={{ background: wallpaper }}>
      <StatusBar />
      <div className="relative min-h-0 flex-1">{primary ? <SplitView /> : <PadHome />}</div>
      {primary && (
        <button {...homeBar} onClick={goHome} aria-label="Go home" className="flex h-6 shrink-0 touch-none items-center justify-center">
          <span aria-hidden className="h-1.5 w-40 rounded-full bg-paper/60" />
        </button>
      )}
      <SlideOver />
      {overlay === "picker" && <AppPicker />}
      {overlay === "switcher" && <Switcher />}
      {overlay === "search" && <Spotlight onClose={closeOverlay} />}
      {overlay === "control" && (
        <Sheet label="Control center" onClose={closeOverlay}>
          <div className="mx-auto max-w-md">
            <QuickSettings
              actions={
                <button onClick={() => setOverlay("switcher")} className="col-span-2 rounded-2xl bg-glass p-3 text-sm">
                  Recent apps
                </button>
              }
            />
          </div>
        </Sheet>
      )}
      {overlay === "shade" && (
        <Sheet label="Notifications" onClose={closeOverlay}>
          <div className="mx-auto max-w-md">
            <NotificationList />
          </div>
        </Sheet>
      )}
    </main>
  );
}
