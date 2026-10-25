"use client";

import { useEffect, useRef } from "react";
import { AppIcon } from "@/design/AppIcon";
import { getApp, type AppId } from "@/os/apps/registry";
import { haptic } from "@/os/system/haptics";
import { useFocusTrap } from "@/shells/shared/useFocusTrap";
import { useSwipe } from "@/shells/shared/useSwipe";
import { usePhone } from "./state";

function SwitcherCard({ id }: { id: AppId }) {
  const app = getApp(id);
  const openApp = usePhone((s) => s.openApp);
  const closeRecent = usePhone((s) => s.closeRecent);
  // Flick a card up to close the app.
  const swipe = useSwipe((dir) => {
    if (dir !== "up") return;
    haptic();
    closeRecent(id);
  });
  if (!app) return null;
  return (
    <li className="relative w-[72%] shrink-0 snap-center">
      <p className="mb-2 flex items-center gap-2 px-1 text-[13px] font-semibold text-white">
        <AppIcon id={app.id} icon={app.icon} size={24} />
        {app.name}
      </p>
      <button
        {...swipe}
        onClick={() => openApp(id)}
        aria-label={`Open ${app.name}. Swipe up to close.`}
        className="flex h-[58vh] max-h-[520px] w-full touch-pan-x flex-col items-center justify-center gap-4 overflow-hidden rounded-[32px] bg-ink shadow-3 ring-1 ring-white/10"
      >
        <AppIcon id={app.id} icon={app.icon} size={84} />
        <span className="text-[15px] font-semibold text-paper">{app.name}</span>
      </button>
      <button onClick={() => closeRecent(id)} className="mt-3 w-full text-center text-[13px] text-white/70">
        Close
      </button>
    </li>
  );
}

// F07 on the phone: recent apps as large cards. Swipe sideways to browse,
// tap to return, flick up to close.
export function AppSwitcher() {
  const recents = usePhone((s) => s.recents);
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
      onClick={(e) => e.target === e.currentTarget && goHome()}
      className="folio-fade-in absolute inset-0 z-40 flex flex-col justify-center bg-black/40 pb-10 pt-14 backdrop-blur-2xl"
    >
      {recents.length === 0 ? (
        <p className="text-center text-[15px] text-white/80">No recent apps</p>
      ) : (
        <ul className="flex snap-x snap-mandatory gap-5 overflow-x-auto px-[14%] pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {recents.map((id) => (
            <SwitcherCard key={id} id={id} />
          ))}
        </ul>
      )}
    </div>
  );
}
