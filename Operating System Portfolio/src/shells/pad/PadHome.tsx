"use client";

import { useEffect, useState } from "react";
import { AppIcon } from "@/design/AppIcon";
import { getApp, launchable, type AppDefinition, type AppId } from "@/os/apps/registry";
import { ClockWidget, ProfileWidget, WeatherTile, WorldWidget } from "@/shells/shared/HomeWidgets";
import { useGridKeys } from "@/shells/shared/useGridKeys";
import { DragTile } from "./dnd";
import { usePad } from "./state";

const DOCK: AppId[] = ["about", "experience", "projects", "contact", "files", "terminal", "settings"];

// Landscape gets one row of widgets and a wider grid, like a real tablet.
function useWide() {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(min-aspect-ratio: 5/4)");
    const update = () => setWide(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return wide;
}

// folioPad's home: widgets across the top, a grid of apps, and a
// large frosted dock with pinned apps, then recent ones after a divider.
export function PadHome() {
  const wide = useWide();
  const columns = wide ? 8 : 6;
  const gridKeys = useGridKeys(columns);
  const dockKeys = useGridKeys(99);
  const recents = usePad((s) => s.recents);
  const setOverlay = usePad((s) => s.setOverlay);
  const gridApps = launchable.filter((a) => !DOCK.includes(a.id));
  const dockApps = DOCK.map(getApp).filter((a): a is AppDefinition => !!a);
  const recentApps = recents
    .filter((id) => !DOCK.includes(id))
    .slice(0, 3)
    .map(getApp)
    .filter((a): a is AppDefinition => !!a);

  return (
    <div className="flex h-full flex-col px-10 pb-4 pt-3">
      <section aria-label="Widgets" className={`grid shrink-0 gap-4 ${wide ? "grid-cols-12" : "grid-cols-6"}`}>
        <ProfileWidget className={wide ? "col-span-5" : "col-span-4"} />
        <ClockWidget className="col-span-2" />
        <WeatherTile className="col-span-2" />
        <WorldWidget className={wide ? "col-span-3 !h-[152px] !grid-cols-2 gap-y-1 py-3" : "col-span-4 !h-[152px]"} />
      </section>

      <nav
        aria-label="Apps"
        onKeyDown={gridKeys}
        className="mt-7 grid min-h-0 flex-1 content-start gap-x-4 gap-y-6 overflow-y-auto pb-4"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {gridApps.map((a) => (
          <DragTile key={a.id} id={a.id} icon={a.icon} label={a.name} size={68} />
        ))}
      </nav>

      <nav aria-label="Dock" onKeyDown={dockKeys} className="mat-thin mx-auto mt-2 flex shrink-0 items-center gap-3 rounded-[30px] px-4 py-3 shadow-3">
        {dockApps.map((a) => (
          <DragTile key={a.id} id={a.id} icon={a.icon} size={58} />
        ))}
        <span aria-hidden className="mx-1 h-12 w-px bg-line-strong" />
        {recentApps.map((a) => (
          <DragTile key={a.id} id={a.id} icon={a.icon} size={58} />
        ))}
        <button onClick={() => setOverlay("launcher")} aria-label="All apps" className="rounded-xl transition-transform active:scale-95">
          <AppIcon id="launcher" icon="launcher" size={58} />
        </button>
      </nav>
    </div>
  );
}
