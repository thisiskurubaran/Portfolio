"use client";

import { profile } from "@/content";
import { formatDate, formatTime, useClock } from "@/os/system/clock";

// F03: the guest login on folioDesk. One button, no password: it only frames the OS.
export function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const now = useClock();
  return (
    <section aria-label="Log in" className="absolute inset-0 z-[20000] flex flex-col items-center justify-center gap-4 bg-ink/40 backdrop-blur-2xl">
      <p className="text-6xl font-light tabular-nums" suppressHydrationWarning>
        {now ? formatTime(now) : ""}
      </p>
      <p className="opacity-75" suppressHydrationWarning>
        {now ? formatDate(now) : ""}
      </p>
      <div className="mt-10 flex h-20 w-20 items-center justify-center rounded-full bg-glass-strong text-2xl font-light">G</div>
      <p className="font-medium">Guest</p>
      <button autoFocus onClick={onLogin} className="rounded-full bg-accent px-6 py-2 text-sm font-medium text-on-accent">
        Log in as guest
      </button>
      <p className="mt-8 text-xs opacity-60">{profile.name}&apos;s folioOS</p>
    </section>
  );
}
