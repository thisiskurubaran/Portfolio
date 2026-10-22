"use client";

import { experience } from "@/content";
import { Icon } from "@/design/icons";
import { launchable, type AppId } from "@/os/apps/registry";
import { formatDate, formatTime, useClock } from "@/os/system/clock";
import { useGridKeys } from "@/shells/shared/useGridKeys";
import { usePhone } from "./state";

const DOCK: AppId[] = ["about", "experience", "projects", "contact"];
const COLUMNS = 4;

function AppButton({ id, label, icon }: { id: AppId; label: string; icon: Parameters<typeof Icon>[0]["name"] }) {
  const openApp = usePhone((s) => s.openApp);
  return (
    <button onClick={() => openApp(id)} className="flex flex-col items-center gap-1.5 rounded-xl p-1 focus-visible:ring-2 focus-visible:ring-accent">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-glass backdrop-blur-xl">
        <Icon name={icon} size={28} />
      </span>
      <span className="text-xs">{label}</span>
    </button>
  );
}

function ClockWidget() {
  const now = useClock();
  return (
    <div className="rounded-3xl bg-glass p-4 backdrop-blur-xl">
      <p className="text-3xl font-light tabular-nums" suppressHydrationWarning>{now ? formatTime(now) : ""}</p>
      <p className="mt-1 text-xs opacity-70" suppressHydrationWarning>{now ? formatDate(now) : ""}</p>
    </div>
  );
}

function NowWidget() {
  const current = experience[0];
  const openApp = usePhone((s) => s.openApp);
  return (
    <button onClick={() => openApp("experience")} className="rounded-3xl bg-glass p-4 text-left backdrop-blur-xl focus-visible:ring-2 focus-visible:ring-accent">
      <p className="text-xs uppercase tracking-wide text-accent-fg">Now</p>
      <p className="mt-1 line-clamp-2 text-sm font-medium">{current.title.split(" (")[0]}</p>
      <p className="mt-0.5 text-xs opacity-70">{current.company}</p>
    </button>
  );
}

export function HomeScreen() {
  const gridKeys = useGridKeys(COLUMNS);
  const dockApps = launchable.filter((a) => DOCK.includes(a.id));
  const gridApps = launchable.filter((a) => !DOCK.includes(a.id));
  const setOverlay = usePhone((s) => s.setOverlay);
  return (
    <div className="flex min-h-0 flex-1 flex-col px-5 pb-4">
      <button
        onClick={() => setOverlay("search")}
        className="mb-3 flex h-10 items-center gap-2 rounded-2xl bg-glass px-4 text-left text-sm opacity-90 backdrop-blur-xl"
      >
        <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16l4.5 4.5" strokeLinecap="round" />
        </svg>
        <span className="opacity-70">Search</span>
      </button>
      <section aria-label="Widgets" className="grid grid-cols-2 gap-3 pt-2">
        <ClockWidget />
        <NowWidget />
      </section>
      <nav aria-label="Apps" onKeyDown={gridKeys} className="mt-5 grid grid-cols-4 content-start gap-x-2 gap-y-5">
        {gridApps.map((app) => (
          <AppButton key={app.id} id={app.id} label={app.name} icon={app.icon} />
        ))}
      </nav>
      <nav aria-label="Dock" onKeyDown={gridKeys} className="mt-auto grid grid-cols-4 gap-2 rounded-3xl bg-glass p-3 backdrop-blur-xl">
        {dockApps.map((app) => (
          <AppButton key={app.id} id={app.id} label={app.name} icon={app.icon} />
        ))}
      </nav>
    </div>
  );
}
