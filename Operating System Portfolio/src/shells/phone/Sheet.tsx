"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useSwipe } from "@/shells/shared/useSwipe";

// A panel that drops from the top. Swipe it up, tap outside or press Escape to close.
export function Sheet({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const swipe = useSwipe((dir) => dir === "up" && onClose());

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.focus({ preventScroll: true });
    return () => previous?.focus?.({ preventScroll: true });
  }, []);

  return (
    <div className="absolute inset-0 z-40" onKeyDown={(e) => e.key === "Escape" && onClose()}>
      <button aria-label="Close" tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        ref={ref}
        {...swipe}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className="absolute inset-x-3 top-3 max-h-[85%] touch-pan-y overflow-auto rounded-3xl border border-white/10 bg-ink/90 p-4 shadow-2xl outline-none backdrop-blur-2xl"
      >
        {children}
        <span aria-hidden className="mx-auto mt-4 block h-1.5 w-16 rounded-full bg-paper/40" />
      </div>
    </div>
  );
}
