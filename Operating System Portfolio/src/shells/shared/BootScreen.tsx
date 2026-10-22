"use client";

import { useEffect } from "react";
import { Icon } from "@/design/icons";
import { useReducedMotion } from "@/os/system/useSystemAttributes";

const BOOT_MS = 1400;

// F03: a short boot, under two seconds, skippable with a click or any key.
export function BootScreen({ shellName, onDone }: { shellName: string; onDone: () => void }) {
  const reduced = useReducedMotion();
  const duration = reduced ? 300 : BOOT_MS;

  useEffect(() => {
    const t = window.setTimeout(onDone, duration);
    const skip = () => onDone();
    window.addEventListener("keydown", skip);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", skip);
    };
  }, [duration, onDone]);

  return (
    <div
      role="status"
      aria-label={`Starting ${shellName}`}
      onClick={onDone}
      className="fixed inset-0 z-[40000] flex flex-col items-center justify-center gap-6 bg-[#07090c] text-[#f6f4ef]"
    >
      <Icon name="logo" size={64} />
      <p className="text-sm tracking-[0.3em] opacity-70">{shellName.toUpperCase()}</p>
      <div className="h-1 w-48 overflow-hidden rounded-full bg-white/10">
        <div className="folio-boot-bar h-full rounded-full bg-[#4cc2a8]" style={{ animationDuration: `${duration}ms` }} />
      </div>
      <button onClick={onDone} className="mt-6 text-xs opacity-60 hover:opacity-100">
        Skip
      </button>
    </div>
  );
}
