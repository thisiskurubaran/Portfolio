"use client";

import { useState, type ReactNode } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { experience } from "@/content";
import { AppIcon } from "@/design/AppIcon";
import { Icon } from "@/design/icons";
import { launchable, pinned, type AppId } from "@/os/apps/registry";
import { safeStorage } from "@/os/state/storage";
import { useClock } from "@/os/system/clock";
import { haptic } from "@/os/system/haptics";
import { useGridKeys } from "@/shells/shared/useGridKeys";
import { useSwipe } from "@/shells/shared/useSwipe";
import { WeatherWidget, WorldClockWidget } from "@/shells/shared/widgets";
import { usePhone } from "./state";

const DOCK: AppId[] = ["about", "experience", "projects", "contact"];
const COLUMNS = 4;

type WidgetId = "clock" | "now" | "weather" | "world";

// F35: the visitor can reorder home screen widgets; the order is remembered.
const useWidgetOrder = create<{ order: WidgetId[]; move: (id: WidgetId, by: -1 | 1) => void }>()(
  persist(
    (set) => ({
      order: ["clock", "now", "weather", "world"],
      move: (id, by) =>
        set((s) => {
          const order = [...s.order];
          const i = order.indexOf(id);
          const j = i + by;
          if (j < 0 || j >= order.length) return s;
          [order[i], order[j]] = [order[j]!, order[i]!];
          return { order };
        }),
    }),
    { name: "folioos.phone-widgets", storage: createJSONStorage(() => safeStorage) },
  ),
);

function AppButton({ id, label, icon }: { id: AppId; label: string; icon: Parameters<typeof Icon>[0]["name"] }) {
  const openApp = usePhone((s) => s.openApp);
  return (
    <button
      onClick={() => {
        haptic();
        openApp(id);
      }}
      className="flex flex-col items-center gap-1.5 rounded-xl p-1 transition-transform active:scale-95"
    >
      <AppIcon id={id} icon={icon} size={58} />
      <span className="text-[11px] font-medium [text-shadow:0_1px_2px_rgb(0_0_0/0.35)]">{label}</span>
    </button>
  );
}

const tile = "h-full rounded-[22px] border border-line bg-surface/55 p-3.5 shadow-2 backdrop-blur-2xl";

function ClockWidget() {
  const now = useClock();
  return (
    <div className={tile}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted" suppressHydrationWarning>
        {now?.toLocaleDateString([], { weekday: "long" })}
      </p>
      <p className="mt-1 font-display text-3xl font-bold tabular-nums" suppressHydrationWarning>
        {now?.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }).replace(/\s?[AP]M/i, "")}
      </p>
      <p className="text-xs text-muted" suppressHydrationWarning>
        {now?.toLocaleDateString([], { month: "long", day: "numeric" })}
      </p>
    </div>
  );
}

function NowWidget() {
  const current = experience[0]!;
  const openApp = usePhone((s) => s.openApp);
  return (
    <button onClick={() => openApp("experience")} className={`${tile} w-full text-left`}>
      <span className="flex items-center gap-2">
        <AppIcon id="experience" icon="experience" size={22} />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-accent-fg">Now</span>
      </span>
      <p className="mt-2 line-clamp-2 text-sm font-semibold leading-snug">{current.title.split(" (")[0]}</p>
      <p className="mt-0.5 truncate text-xs text-muted">{current.company}</p>
    </button>
  );
}

const widgetSkin = "!h-full !rounded-[22px] !border !border-line !bg-surface/55 !p-3.5 !shadow-2";

const widgets: Record<WidgetId, { label: string; render: () => ReactNode }> = {
  clock: { label: "Clock", render: () => <ClockWidget /> },
  now: { label: "Now", render: () => <NowWidget /> },
  weather: { label: "Weather", render: () => <WeatherWidget className={widgetSkin} /> },
  world: { label: "World clock", render: () => <WorldClockWidget zones={2} className={`${widgetSkin} text-xs`} /> },
};

export function HomeScreen() {
  const gridKeys = useGridKeys(COLUMNS);
  const dockApps = launchable.filter((a) => DOCK.includes(a.id));
  // The rest of the apps live in the App Library, one swipe away.
  const gridApps = launchable.filter((a) => pinned.includes(a.id) && !DOCK.includes(a.id));
  const setOverlay = usePhone((s) => s.setOverlay);
  const { order, move } = useWidgetOrder();
  const [editing, setEditing] = useState(false);
  // Swiping left from the home screen opens the App Library, as a second page would.
  const swipe = useSwipe((dir) => {
    if (dir !== "left") return;
    haptic();
    setOverlay("launcher");
  });
  return (
    <div {...swipe} className="flex min-h-0 flex-1 touch-pan-y flex-col overflow-y-auto px-5 pb-4">
      <button
        onClick={() => setOverlay("search")}
        className="mb-3 flex h-10 shrink-0 items-center gap-2 rounded-2xl border border-line bg-surface/55 px-4 text-left text-sm shadow-1 backdrop-blur-xl"
      >
        <Icon name="search" size={16} className="text-muted" />
        <span className="text-muted">Search</span>
      </button>

      <section aria-label="Widgets" className="grid shrink-0 auto-rows-[112px] grid-cols-2 gap-3">
        {order.map((id, i) => (
          <div key={id} className={`relative ${editing ? "folio-wiggle" : ""}`}>
            {widgets[id].render()}
            {editing && (
              <div className="absolute inset-x-2 bottom-2 flex justify-between">
                <button aria-label={`Move ${widgets[id].label} earlier`} disabled={i === 0} onClick={() => move(id, -1)} className="rounded-full bg-ink/80 p-1.5 text-paper disabled:opacity-30">
                  <Icon name="chevron" size={14} className="rotate-180" />
                </button>
                <button
                  aria-label={`Move ${widgets[id].label} later`}
                  disabled={i === order.length - 1}
                  onClick={() => move(id, 1)}
                  className="rounded-full bg-ink/80 p-1.5 text-paper disabled:opacity-30"
                >
                  <Icon name="chevron" size={14} />
                </button>
              </div>
            )}
          </div>
        ))}
      </section>
      <button onClick={() => setEditing((e) => !e)} className="mt-2 self-end rounded-full bg-glass px-3 py-1 text-xs font-medium backdrop-blur-xl">
        {editing ? "Done" : "Edit widgets"}
      </button>

      <nav aria-label="Apps" onKeyDown={gridKeys} className="mt-3 grid shrink-0 grid-cols-4 content-start gap-x-2 gap-y-4">
        {gridApps.map((app) => (
          <AppButton key={app.id} id={app.id} label={app.name} icon={app.icon} />
        ))}
        <button onClick={() => setOverlay("launcher")} className="flex flex-col items-center gap-1.5 rounded-xl p-1 transition-transform active:scale-95">
          <AppIcon id="launcher" icon="launcher" size={58} />
          <span className="text-[11px] font-medium [text-shadow:0_1px_2px_rgb(0_0_0/0.35)]">All apps</span>
        </button>
      </nav>
      <nav aria-label="Dock" onKeyDown={gridKeys} className="mt-auto grid shrink-0 grid-cols-4 gap-2 rounded-[28px] border border-line bg-surface/50 p-3 pt-4 shadow-3 backdrop-blur-2xl">
        {dockApps.map((app) => (
          <AppButton key={app.id} id={app.id} label={app.name} icon={app.icon} />
        ))}
      </nav>
    </div>
  );
}
