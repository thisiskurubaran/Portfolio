"use client";

import { useEffect, useRef } from "react";
import { AppIcon } from "@/design/AppIcon";
import { getApp } from "@/os/apps/registry";
import { useFocusTrap } from "@/shells/shared/useFocusTrap";
import { usePhone } from "./state";

// F07 on the phone: recent apps as cards. Tap one to return to it, or close it.
export function AppSwitcher() {
  const recents = usePhone((s) => s.recents);
  const openApp = usePhone((s) => s.openApp);
  const closeRecent = usePhone((s) => s.closeRecent);
  const goHome = usePhone((s) => s.goHome);
  const ref = useRef<HTMLDivElement>(null);
  const trap = useFocusTrap(ref);

  useEffect(() => {
    ref.current?.querySelector<HTMLElement>("button")?.focus();
  }, []);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label="Recent apps"
      onKeyDown={(e) => (e.key === "Escape" ? goHome() : trap(e))}
      className="absolute inset-0 z-40 flex flex-col bg-ink/70 px-5 pb-6 pt-14 backdrop-blur-2xl"
    >
      <h2 className="mb-4 text-sm opacity-70">{recents.length ? "Recent apps" : "No recent apps"}</h2>
      <ul className="flex min-h-0 flex-1 snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
        {recents.map((id) => {
          const app = getApp(id);
          if (!app) return null;
          return (
            <li key={id} className="relative w-[70%] shrink-0 snap-center">
              <button
                onClick={() => openApp(id)}
                className="flex h-full max-h-[60vh] w-full flex-col overflow-hidden rounded-3xl border border-line bg-ink text-left shadow-2xl"
              >
                <span className="flex items-center gap-2 border-b border-line p-3 text-sm">
                  <AppIcon id={app.id} icon={app.icon} size={20} />
                  {app.name}
                </span>
                <span className="flex flex-1 items-center justify-center">
                  <AppIcon id={app.id} icon={app.icon} size={72} />
                </span>
              </button>
              <button onClick={() => closeRecent(id)} className="mt-2 w-full text-center text-xs opacity-70">
                Close {app.name}
              </button>
            </li>
          );
        })}
      </ul>
      <button onClick={goHome} className="mx-auto mt-2 rounded-full bg-glass px-5 py-2 text-sm">
        Home
      </button>
    </div>
  );
}
