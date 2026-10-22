"use client";

import { Icon } from "@/design/icons";
import { launchable } from "@/os/apps/registry";
import { useWindows } from "@/os/state/windows";
import { useGridKeys } from "@/shells/shared/useGridKeys";

export function Dock() {
  const windows = useWindows((s) => s.windows);
  const open = useWindows((s) => s.open);
  // One row, so up and down never move focus.
  const keys = useGridKeys(99);
  return (
    <nav
      aria-label="Dock"
      onKeyDown={keys}
      className="absolute bottom-3 left-1/2 z-[9999] flex -translate-x-1/2 gap-2 rounded-2xl border border-white/10 bg-glass px-3 py-2 backdrop-blur-xl"
    >
      {launchable.map((app) => {
        const isOpen = windows.some((w) => w.appId === app.id);
        return (
          <button
            key={app.id}
            onClick={() => open(app.id)}
            aria-label={app.name}
            title={app.name}
            className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 transition-transform hover:-translate-y-1 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Icon name={app.icon} size={26} />
            {isOpen && <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-accent" />}
          </button>
        );
      })}
    </nav>
  );
}
