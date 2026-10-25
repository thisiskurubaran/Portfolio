"use client";

import type { MouseEvent } from "react";
import { experience, profile } from "@/content";
import { formatInZone, useClock, worldZones } from "@/os/system/clock";
import { launch } from "@/os/system/launcher";
import { useWeather } from "@/os/system/weather";
import { describeWeather } from "@/os/system/weatherTypes";

// Home screen widgets shared by folioPhone and folioPad. "span" sets how many
// grid columns a widget covers; onOpen lets a shell animate from the widget.
type Open = (e: MouseEvent<HTMLButtonElement>) => void;

// Widgets: vivid backgrounds, rounded like the icons, sized to the grid.
export function ProfileWidget({ onOpen, className = "col-span-4" }: { onOpen?: Open; className?: string }) {
  const current = experience[0]!;
  return (
    <button
      onClick={(e) => (onOpen ? onOpen(e) : launch("about"))}
      className={`${className} flex h-[152px] flex-col justify-between rounded-[26px] p-4 text-left text-white shadow-2`}
      style={{ background: "radial-gradient(circle at 85% 15%, #b38bff 0%, transparent 55%), linear-gradient(140deg, #5a52f5, #8b4fe8 60%, #c2459b)" }}
    >
      <span className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-lg font-bold ring-2 ring-white/40">KA</span>
        <span className="min-w-0">
          <span className="block truncate text-[17px] font-bold">{profile.name}</span>
          <span className="block truncate text-[13px] text-white/80">{current.title.split(" (")[0]}</span>
        </span>
      </span>
      <span className="flex items-end justify-between">
        <span className="text-[13px] text-white/85">{current.company}</span>
        <span className="flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold">
          <span className="h-1.5 w-1.5 rounded-full bg-[#4ff28f]" /> Open to work
        </span>
      </span>
    </button>
  );
}

export function ClockWidget({ className = "col-span-2" }: { className?: string }) {
  const now = useClock(15_000);
  return (
    <div className={`mat-regular ${className} flex h-[152px] flex-col justify-between rounded-[26px] p-4 text-paper`}>
      <span className="text-[13px] font-semibold text-sys-red" suppressHydrationWarning>
        {now?.toLocaleDateString([], { weekday: "long" }).toUpperCase()}
      </span>
      <span>
        <span className="block text-[40px] font-bold leading-none tracking-tight tabular-nums" suppressHydrationWarning>
          {now?.getDate()}
        </span>
        <span className="mt-1 block text-[13px] text-muted" suppressHydrationWarning>
          {now?.toLocaleDateString([], { month: "long" })} · {now?.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
        </span>
      </span>
    </div>
  );
}

export function WeatherTile({ className = "col-span-2" }: { className?: string }) {
  const { status, weather } = useWeather();
  return (
    <div className={`${className} flex h-[152px] flex-col justify-between rounded-[26px] p-4 text-white shadow-2`} style={{ background: "linear-gradient(170deg, #3d8bff, #6cb6ff 70%, #9fd0ff)" }}>
      <span className="truncate text-[13px] font-semibold">{weather?.city ?? "Weather"}</span>
      {status !== "done" ? (
        <span className="text-sm text-white/85">Checking</span>
      ) : weather ? (
        <span>
          <span className="block text-[40px] font-semibold leading-none tracking-tight">{weather.temperature}°</span>
          <span className="mt-1 block text-[13px] text-white/90">{describeWeather(weather.code)}</span>
        </span>
      ) : (
        <span className="text-[13px] leading-snug text-white/90">Weather is not available for this connection.</span>
      )}
    </div>
  );
}

export function WorldWidget({ className = "col-span-4" }: { className?: string }) {
  const now = useClock(30_000);
  return (
    <div className={`mat-regular ${className} grid h-[110px] grid-cols-4 items-center rounded-[26px] px-3 text-paper`}>
      {worldZones.slice(0, 4).map((z) => (
        <div key={z.zone} className="text-center">
          <p className="truncate text-[11px] font-semibold text-muted">{z.city}</p>
          <p className="mt-1 text-[15px] font-semibold tabular-nums" suppressHydrationWarning>
            {now ? formatInZone(now, z.zone).replace(/\s?[AP]M/i, "") : ""}
          </p>
        </div>
      ))}
    </div>
  );
}

