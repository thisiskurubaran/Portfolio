"use client";

import { experience, profile } from "@/content";
import { AppIcon } from "@/design/AppIcon";
import { Icon } from "@/design/icons";
import { launchable, type AppId } from "@/os/apps/registry";
import { formatDate, formatTime, useClock } from "@/os/system/clock";
import { useGridKeys } from "@/shells/shared/useGridKeys";
import { WeatherWidget, WorldClockWidget } from "@/shells/shared/widgets";
import { DragTile } from "./dnd";
import { usePad } from "./state";

const DOCK: AppId[] = ["about", "experience", "projects", "contact", "terminal", "settings"];
const COLUMNS = 6;

function AppTile({ id, label, icon, size = 60 }: { id: AppId; label?: string; icon: Parameters<typeof Icon>[0]["name"]; size?: number }) {
  return <DragTile id={id} icon={icon} label={label} size={size} />;
}

export function PadHome() {
  const now = useClock();
  const gridKeys = useGridKeys(COLUMNS);
  const current = experience[0];
  const pick = usePad((s) => s.pick);
  const gridApps = launchable.filter((a) => !DOCK.includes(a.id));
  const dockApps = DOCK.map((id) => launchable.find((a) => a.id === id)!).filter(Boolean);
  return (
    <div className="flex h-full flex-col px-10 pb-5 pt-4">
      <section aria-label="Widgets" className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <div className="rounded-[22px] border border-line bg-surface/55 p-5 shadow-2 backdrop-blur-2xl">
          <p className="font-display text-4xl font-bold tabular-nums" suppressHydrationWarning>
            {now ? formatTime(now).replace(/\s?([AP]M)$/i, "") : ""}
            <span className="ml-1 text-base font-semibold text-muted">{now ? (formatTime(now).match(/[AP]M$/i)?.[0] ?? "") : ""}</span>
          </p>
          <p className="mt-1 text-sm text-muted" suppressHydrationWarning>{now ? formatDate(now) : ""}</p>
        </div>
        <WeatherWidget className="!rounded-[22px] !border !border-line !bg-surface/55 !p-5 !shadow-2" />
        <div className="rounded-[22px] border border-line bg-surface/55 p-5 shadow-2 backdrop-blur-2xl">
          <p className="text-xs uppercase tracking-wide text-accent-fg">Now</p>
          <p className="mt-1 text-sm font-medium">{current.title.split(" (")[0]}</p>
          <p className="text-xs text-muted">{current.company}</p>
        </div>
        <WorldClockWidget className="!rounded-[22px] !border !border-line !bg-surface/55 !p-5 !shadow-2" zones={3} />
        <div className="col-span-full flex items-center gap-4 rounded-3xl bg-glass px-5 py-3 backdrop-blur-xl">
          <p className="text-sm font-medium">{profile.name}</p>
          <p className="text-xs text-muted">{profile.location}</p>
          <div className="ml-auto flex gap-2 text-xs">
            <button onClick={() => pick("split")} className="rounded-full bg-glass-strong px-3 py-1">
              Split view
            </button>
            <button onClick={() => pick("slide")} className="rounded-full bg-glass-strong px-3 py-1">
              Slide-over
            </button>
          </div>
        </div>
      </section>
      <nav aria-label="Apps" onKeyDown={gridKeys} className="mt-8 grid grid-cols-6 content-start gap-x-4 gap-y-6">
        {gridApps.map((app) => (
          <AppTile key={app.id} id={app.id} label={app.name} icon={app.icon} />
        ))}
      </nav>
      <nav aria-label="Dock" onKeyDown={useGridKeys(99)} className="mx-auto mt-auto flex gap-3 rounded-[28px] border border-line bg-surface/50 p-3 shadow-3 backdrop-blur-2xl">
        <button onClick={() => usePad.getState().setOverlay("launcher")} aria-label="All apps" className="flex flex-col items-center gap-1.5 rounded-xl p-1">
          <AppIcon id="launcher" icon="launcher" size={52} />
          <span className="text-xs">All apps</span>
        </button>
        {dockApps.map((app) => (
          <AppTile key={app.id} id={app.id} icon={app.icon} label={app.name} size={52} />
        ))}
      </nav>
    </div>
  );
}
