"use client";

import { useEffect, useRef } from "react";
import { QuickSettings } from "@/shells/shared/QuickSettings";
import { useFocusTrap } from "@/shells/shared/useFocusTrap";
import { useDesk } from "./state";

// The folioDesk control center, dropped from the status cluster in the menu bar.
export function QuickPanel() {
  const setOverlay = useDesk((s) => s.setOverlay);
  const ref = useRef<HTMLDivElement>(null);
  const trap = useFocusTrap(ref);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <>
      <div className="fixed inset-0 z-[14000]" onClick={() => setOverlay(null)} aria-hidden />
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-label="Quick settings"
        onKeyDown={(e) => (e.key === "Escape" ? setOverlay(null) : trap(e))}
        className="fixed right-2 top-9 z-[14001] w-[340px] rounded-sheet border border-line bg-surface/90 p-4 shadow-3 outline-none backdrop-blur-2xl"
      >
        <QuickSettings />
      </div>
    </>
  );
}
