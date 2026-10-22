"use client";

import { AppIcon } from "@/design/AppIcon";
import { launchable } from "@/os/apps/registry";
import { useWindows } from "@/os/state/windows";
import { useGridKeys } from "@/shells/shared/useGridKeys";
import { dockMenu } from "./menus";
import { useDesk } from "./state";

export function Dock() {
  const windows = useWindows((s) => s.windows);
  const open = useWindows((s) => s.open);
  // One row, so up and down never move focus.
  const keys = useGridKeys(99);
  return (
    <nav
      aria-label="Dock"
      onKeyDown={keys}
      className="absolute bottom-3 left-1/2 z-[9999] flex -translate-x-1/2 items-end gap-1.5 rounded-[24px] border border-line bg-surface/60 px-2.5 pb-2 pt-2.5 shadow-3 backdrop-blur-2xl"
    >
      <button
        onClick={() => useDesk.getState().toggle("launcher")}
        aria-label="All apps (F4)"
        className="group relative flex flex-col items-center rounded-2xl outline-offset-4 transition-transform duration-200 ease-[var(--ease-out-soft)] hover:-translate-y-2 hover:scale-110 focus-visible:-translate-y-2"
      >
        <span className="pointer-events-none absolute -top-9 whitespace-nowrap rounded-md border border-line bg-surface px-2 py-1 text-xs font-medium opacity-0 shadow-2 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          All apps
        </span>
        <AppIcon id="launcher" icon="launcher" size={48} />
        <span aria-hidden className="mt-1 h-1 w-1" />
      </button>
      <span aria-hidden className="mx-1 mb-3 h-10 w-px self-center bg-line-strong" />
      {launchable.map((app) => {
        const isOpen = windows.some((w) => w.appId === app.id);
        return (
          <button
            key={app.id}
            onClick={() => open(app.id)}
            onContextMenu={(e) => {
              e.preventDefault();
              const r = e.currentTarget.getBoundingClientRect();
              useDesk.getState().openMenu({ x: r.left, y: r.top - 10, above: true, label: app.name, items: dockMenu(app.id, app.name) });
            }}
            aria-label={app.name}
            className="group relative flex flex-col items-center rounded-2xl outline-offset-4 transition-transform duration-200 ease-[var(--ease-out-soft)] hover:-translate-y-2 hover:scale-110 focus-visible:-translate-y-2"
          >
            <span className="pointer-events-none absolute -top-9 whitespace-nowrap rounded-md border border-line bg-surface px-2 py-1 text-xs font-medium opacity-0 shadow-2 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              {app.name}
            </span>
            <AppIcon id={app.id} icon={app.icon} size={48} />
            <span aria-hidden className={`mt-1 h-1 w-1 rounded-full ${isOpen ? "bg-paper/80" : "bg-transparent"}`} />
          </button>
        );
      })}
    </nav>
  );
}
