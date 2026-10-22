"use client";

import { useEffect, useRef } from "react";
import { launch } from "@/os/system/launcher";
import { ContinuityStrip } from "@/shells/shared/ContinuityStrip";
import { PowerRow } from "@/shells/shared/PowerRow";
import { useFocusTrap } from "@/shells/shared/useFocusTrap";
import { useDesk } from "./state";

// The folioOS logo menu: device switcher, settings, plain view and logging out.
export function SystemMenu({ onLogout }: { onLogout: () => void }) {
  const setOverlay = useDesk((s) => s.setOverlay);
  const ref = useRef<HTMLDivElement>(null);
  const trap = useFocusTrap(ref);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>("button")?.focus();
  }, []);
  const item = "block w-full rounded px-3 py-1.5 text-left text-sm hover:bg-glass";
  return (
    <>
      <div className="fixed inset-0 z-[14000]" onClick={() => setOverlay(null)} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-label="folioOS menu"
        onKeyDown={(e) => (e.key === "Escape" ? setOverlay(null) : trap(e))}
        className="fixed left-2 top-8 z-[14001] w-80 rounded-window border border-line bg-ink/90 p-3 shadow-2xl backdrop-blur-2xl"
      >
        <p className="mb-2 text-xs uppercase tracking-wide opacity-60">Open as</p>
        <ContinuityStrip compact />
        <hr className="my-3 border-line" />
        <button className={item} onClick={() => launch("settings")}>
          Settings
        </button>
        <a className={item} href="/plain">
          Plain view
        </a>
        <a className={item} href="/privacy">
          Privacy
        </a>
        <hr className="my-3 border-line" />
        <PowerRow onLock={onLogout} onDone={() => setOverlay(null)} />
      </div>
    </>
  );
}
