"use client";

import type { ReactNode } from "react";
import { Icon } from "@/design/icons";
import { LogoMark } from "@/design/Logo";
import { getApp } from "@/os/apps/registry";
import { useClock } from "@/os/system/clock";
import { useNotifications } from "@/os/state/notifications";
import { useWindows } from "@/os/state/windows";
import { StatusIcons, WeatherText } from "@/shells/shared/widgets";
import { OnlineCount } from "./Cursors";
import { useDesk, type DeskOverlay } from "./state";

function BarButton({ label, onClick, active, children }: { label: string; onClick: () => void; active?: boolean; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-6 items-center gap-1.5 rounded-md px-2 transition-colors hover:bg-glass-strong ${active ? "bg-glass-strong" : ""}`}
    >
      {children}
    </button>
  );
}

export function MenuBar() {
  const focusedId = useWindows((s) => s.focusedId);
  const appId = useWindows((s) => s.windows.find((w) => w.id === focusedId && !w.minimized)?.appId);
  const overlay = useDesk((s) => s.overlay);
  const toggle = useDesk((s) => s.toggle);
  const unread = useNotifications((s) => s.items.filter((n) => !n.read).length);
  const now = useClock();
  const label = appId ? getApp(appId)?.name : "Desktop";
  const is = (o: DeskOverlay) => overlay === o;
  return (
    <header className="absolute inset-x-0 top-0 z-[9999] flex h-[30px] items-center gap-1 border-b border-line bg-surface/55 px-2 text-[13px] backdrop-blur-xl">
      <BarButton label="folioOS menu" onClick={() => toggle("menu")} active={is("menu")}>
        <LogoMark variant="mono" size={16} />
      </BarButton>
      <span className="px-1.5 font-semibold">{label}</span>

      <div className="ml-auto flex items-center gap-0.5">
        <OnlineCount />
        <BarButton label="Leave a sticky note" onClick={() => toggle("sticky")} active={is("sticky")}>
          <Icon name="sticky" size={15} />
        </BarButton>
        <BarButton label="Open windows (Ctrl+Up)" onClick={() => toggle("overview")} active={is("overview")}>
          <Icon name="windows" size={15} />
        </BarButton>
        <BarButton label="Search (Ctrl+Space)" onClick={() => toggle("spotlight")} active={is("spotlight")}>
          <Icon name="search" size={15} />
        </BarButton>
        {/* Weather, network and battery as one control that opens quick settings. */}
        <BarButton label="Quick settings" onClick={() => toggle("control")} active={is("control")}>
          <WeatherText compact />
          <StatusIcons />
        </BarButton>
        <BarButton label={`Notification center${unread ? `, ${unread} unread` : ""}`} onClick={() => toggle("center")} active={is("center")}>
          <span className="relative tabular-nums font-medium" suppressHydrationWarning>
            {now?.toLocaleString([], { weekday: "short", day: "numeric", month: "short" })}
            <span className="ml-2">{now?.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
            {unread > 0 && <span aria-hidden className="absolute -right-2 -top-0.5 h-1.5 w-1.5 rounded-full bg-accent" />}
          </span>
        </BarButton>
      </div>
    </header>
  );
}
