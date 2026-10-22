"use client";

import { LogoMark } from "@/design/Logo";
import { useSystem } from "@/os/system/systemState";

// After "Shut down": a dark screen with one power button that boots again.
export function ShutDownScreen() {
  const restart = useSystem((s) => s.restart);
  return (
    <div role="dialog" aria-label="folioOS is shut down" className="fixed inset-0 z-[55000] flex flex-col items-center justify-center gap-8 bg-black text-[#a3acb7]">
      <LogoMark variant="mono" size={36} className="opacity-40" />
      <button
        autoFocus
        onClick={restart}
        aria-label="Power on"
        className="flex h-16 w-16 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:bg-white/10"
      >
        <svg aria-hidden width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M12 4v7M7.5 6.5a7 7 0 1 0 9 0" />
        </svg>
      </button>
      <p className="text-sm">folioOS is off. Press the button to start it again.</p>
      <a href="/plain" className="text-sm underline">
        Or read the plain view
      </a>
    </div>
  );
}
