"use client";

import { useMemo, useRef, useState } from "react";
import { AppIcon } from "@/design/AppIcon";
import { launchable } from "@/os/apps/registry";
import { launch } from "@/os/system/launcher";
import { useFocusTrap } from "./useFocusTrap";
import { useGridKeys } from "./useGridKeys";

// F17: every app in one grid, A to Z, with a filter. Launchpad on folioDesk
// and folioPad, the App Library on folioPhone.
export function Launchpad({ onClose, columns = 6, title = "All apps" }: { onClose: () => void; columns?: number; title?: string }) {
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const trap = useFocusTrap(ref);
  const keys = useGridKeys(columns);
  const apps = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...launchable].sort((a, b) => a.name.localeCompare(b.name)).filter((a) => !q || a.name.toLowerCase().includes(q));
  }, [query]);

  const open = (id: (typeof launchable)[number]["id"]) => {
    onClose();
    launch(id);
  };

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
        else trap(e);
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="folio-fade-in absolute inset-0 z-[16000] flex flex-col items-center overflow-auto bg-ink/70 px-6 pb-10 pt-14 backdrop-blur-2xl"
    >
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && apps[0] && open(apps[0].id)}
        placeholder="Search apps"
        aria-label="Search apps"
        className="mb-10 h-10 w-full max-w-xs rounded-full border border-line bg-surface/70 px-4 text-sm outline-none placeholder:text-subtle focus:border-accent"
      />
      <nav aria-label="Apps" onKeyDown={keys} className="grid w-full max-w-4xl gap-x-4 gap-y-8" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {apps.map((app) => (
          <button key={app.id} onClick={() => open(app.id)} className="flex flex-col items-center gap-2 rounded-2xl p-2 transition-transform hover:scale-105 focus-visible:scale-105">
            <AppIcon id={app.id} icon={app.icon} size={columns > 4 ? 72 : 60} />
            <span className="text-xs font-medium">{app.name}</span>
          </button>
        ))}
      </nav>
      {apps.length === 0 && <p className="text-sm text-muted">No app called &quot;{query}&quot;.</p>}
    </div>
  );
}
