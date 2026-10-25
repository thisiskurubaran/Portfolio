"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { AppIcon } from "@/design/AppIcon";
import { Icon, type IconName } from "@/design/icons";
import { launchable, pinned, type AppId } from "@/os/apps/registry";
import { safeStorage } from "@/os/state/storage";
import { haptic } from "@/os/system/haptics";
import { ClockWidget, ProfileWidget, WeatherTile, WorldWidget } from "@/shells/shared/HomeWidgets";
import { originOf, usePhone } from "./state";

const DOCK: AppId[] = ["about", "experience", "projects", "contact"];
const FIRST_PAGE = 8;

type WidgetId = "clock" | "weather";

// F35: the two small widgets can swap places; the order is remembered.
const useWidgetOrder = create<{ order: WidgetId[]; swap: () => void }>()(
  persist((set) => ({ order: ["clock", "weather"], swap: () => set((s) => ({ order: [s.order[1]!, s.order[0]!] })) }), {
    name: "folioos.phone-widgets-v2",
    storage: createJSONStorage(() => safeStorage),
  }),
);

function AppButton({ id, label, icon, showLabel = true }: { id: AppId; label: string; icon: IconName; showLabel?: boolean }) {
  const openApp = usePhone((s) => s.openApp);
  return (
    <button
      onClick={(e) => {
        haptic();
        openApp(id, originOf(e.currentTarget.querySelector("[data-icon]") ?? e.currentTarget));
      }}
      aria-label={label}
      className="flex flex-col items-center gap-1.5 transition-transform active:scale-90"
    >
      <span data-icon>
        <AppIcon id={id} icon={icon} size={60} />
      </span>
      {showLabel && <span className="home-label max-w-[72px] truncate text-[11px] font-medium">{label}</span>}
    </button>
  );
}

const smallWidgets: Record<WidgetId, () => ReactNode> = { clock: () => <ClockWidget />, weather: () => <WeatherTile /> };

// The last page: every app A to Z, with a filter.
function AppLibrary() {
  const [q, setQ] = useState("");
  const apps = useMemo(
    () => [...launchable].sort((a, b) => a.name.localeCompare(b.name)).filter((a) => a.name.toLowerCase().includes(q.trim().toLowerCase())),
    [q],
  );
  return (
    <div className="flex h-full flex-col">
      <label className="mat-regular mb-4 flex h-10 items-center gap-2 rounded-xl px-3 text-paper">
        <Icon name="search" size={16} className="text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="App Library" aria-label="Search apps" className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted" />
      </label>
      <ul className="mat-regular min-h-0 flex-1 divide-y divide-line overflow-auto rounded-[22px] text-paper">
        {apps.map((a) => (
          <li key={a.id}>
            <AppRow id={a.id} name={a.name} icon={a.icon} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function AppRow({ id, name, icon }: { id: AppId; name: string; icon: IconName }) {
  const openApp = usePhone((s) => s.openApp);
  return (
    <button onClick={(e) => openApp(id, originOf(e.currentTarget.querySelector("[data-icon]") ?? e.currentTarget))} className="flex w-full items-center gap-3 px-3 py-2 text-left active:bg-glass">
      <span data-icon>
        <AppIcon id={id} icon={icon} size={36} />
      </span>
      <span className="flex-1 text-[15px]">{name}</span>
      <Icon name="chevron" size={14} className="text-subtle" />
    </button>
  );
}

export function HomeScreen() {
  const setOverlay = usePhone((s) => s.setOverlay);
  const { order, swap } = useWidgetOrder();
  const [editing, setEditing] = useState(false);
  const [page, setPage] = useState(0);
  const pager = useRef<HTMLDivElement>(null);
  const pressTimer = useRef(0);

  const dockApps = launchable.filter((a) => DOCK.includes(a.id));
  // Pinned apps lead, and the first page fills two full rows under the widgets.
  const ordered = [...launchable.filter((a) => pinned.includes(a.id)), ...launchable.filter((a) => !pinned.includes(a.id))].filter((a) => !DOCK.includes(a.id));
  const firstPage = ordered.slice(0, FIRST_PAGE);
  const secondPage = ordered.slice(FIRST_PAGE);
  const PAGES = 3;

  // Long press on a widget enters edit mode, as on a real phone.
  const pressStart = () => {
    pressTimer.current = window.setTimeout(() => {
      haptic(20);
      setEditing(true);
    }, 550);
  };
  const pressEnd = () => window.clearTimeout(pressTimer.current);

  const goTo = (i: number) => pager.current?.scrollTo({ left: i * pager.current.clientWidth, behavior: "smooth" });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        ref={pager}
        onScroll={(e) => setPage(Math.round(e.currentTarget.scrollLeft / Math.max(1, e.currentTarget.clientWidth)))}
        className="flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <section aria-label="Home page 1" className="w-full shrink-0 snap-start overflow-y-auto px-5 pt-2">
          <div className="grid grid-cols-4 gap-x-3 gap-y-4" onPointerDown={pressStart} onPointerUp={pressEnd} onPointerLeave={pressEnd} onPointerCancel={pressEnd}>
            <ProfileWidget onOpen={(e) => usePhone.getState().openApp("about", originOf(e.currentTarget))} />
            {order.map((id) => (
              <div key={id} className={`col-span-2 ${editing ? "folio-wiggle" : ""}`}>
                <div className="grid grid-cols-2">{smallWidgets[id]()}</div>
              </div>
            ))}
          </div>
          {editing && (
            <div className="mt-3 flex justify-center gap-2">
              <button onClick={swap} className="mat-regular rounded-full px-4 py-1.5 text-[13px] font-semibold text-paper">
                Swap widgets
              </button>
              <button onClick={() => setEditing(false)} className="rounded-full bg-paper px-4 py-1.5 text-[13px] font-semibold text-ink">
                Done
              </button>
            </div>
          )}
          <nav aria-label="Apps" className="mt-5 grid grid-cols-4 gap-x-3 gap-y-5">
            {firstPage.map((a) => (
              <AppButton key={a.id} id={a.id} label={a.name} icon={a.icon} />
            ))}
          </nav>
        </section>

        <section aria-label="Home page 2" className="w-full shrink-0 snap-start overflow-y-auto px-5 pt-2">
          <div className="grid grid-cols-4 gap-x-3">
            <WorldWidget />
          </div>
          <nav aria-label="More apps" className="mt-5 grid grid-cols-4 gap-x-3 gap-y-5">
            {secondPage.map((a) => (
              <AppButton key={a.id} id={a.id} label={a.name} icon={a.icon} />
            ))}
          </nav>
        </section>

        <section aria-label="App Library" className="w-full shrink-0 snap-start px-5 pb-3 pt-2">
          <AppLibrary />
        </section>
      </div>

      <div className="flex shrink-0 flex-col items-center gap-2 py-2">
        <div role="tablist" aria-label="Pages" className="flex items-center gap-2">
          {Array.from({ length: PAGES }, (_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={page === i}
              aria-label={i === PAGES - 1 ? "App Library" : `Page ${i + 1}`}
              onClick={() => goTo(i)}
              className={`h-[7px] w-[7px] rounded-full transition-colors ${page === i ? "home-dot-on" : "home-dot-off"}`}
            />
          ))}
        </div>
        <button onClick={() => setOverlay("search")} className="mat-thin flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium text-paper">
          <Icon name="search" size={13} /> Search
        </button>
      </div>

      <nav aria-label="Dock" className="mat-thin mx-3 mb-4 grid shrink-0 grid-cols-4 justify-items-center rounded-[34px] px-3 py-3">
        {dockApps.map((a) => (
          <AppButton key={a.id} id={a.id} label={a.name} icon={a.icon} showLabel={false} />
        ))}
      </nav>
    </div>
  );
}
