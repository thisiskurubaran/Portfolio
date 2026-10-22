"use client";

import { formatInZone, useClock, worldZones } from "@/os/system/clock";
import { useBattery, useNetwork } from "@/os/system/status";
import { useWeather } from "@/os/system/weather";
import { describeWeather } from "@/os/system/weatherTypes";

export function WeatherText({ compact = false }: { compact?: boolean }) {
  const { status, weather } = useWeather();
  if (status !== "done") return compact ? null : <span className="opacity-60">Checking the weather</span>;
  if (!weather) return compact ? null : <span className="opacity-60">Weather unavailable here</span>;
  if (compact) return <span>{`${weather.temperature}°`}</span>;
  return (
    <span>
      {weather.temperature}° {describeWeather(weather.code)}
      {weather.city && <span className="opacity-70">, {weather.city}</span>}
    </span>
  );
}

// F23: city level weather from the server's geo headers, never the GPS.
export function WeatherWidget({ className = "" }: { className?: string }) {
  const { status, weather } = useWeather();
  return (
    <div className={`rounded-3xl bg-glass p-4 backdrop-blur-xl ${className}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{weather?.city ?? "Weather"}</p>
      {status !== "done" ? (
        <p className="mt-2 text-sm text-muted">Checking</p>
      ) : weather ? (
        <>
          <p className="mt-1 font-display text-3xl font-bold tabular-nums">{weather.temperature}°</p>
          <p className="text-xs text-muted">
            {describeWeather(weather.code)} · wind {weather.wind} km/h
          </p>
        </>
      ) : (
        <p className="mt-2 text-sm text-muted">Not available for this connection</p>
      )}
    </div>
  );
}

// F22: a few zones beside the visitor's own time.
export function WorldClockWidget({ className = "", zones = 4 }: { className?: string; zones?: number }) {
  const now = useClock(30_000);
  return (
    <div className={`rounded-3xl bg-glass p-4 backdrop-blur-xl ${className}`}>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">World clock</p>
      <ul className="space-y-1 text-sm">
        {worldZones.slice(0, zones).map((z) => (
          <li key={z.zone} className="flex justify-between gap-3">
            <span className="truncate text-muted">{z.city}</span>
            <span className="whitespace-nowrap tabular-nums" suppressHydrationWarning>
              {now ? formatInZone(now, z.zone) : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// F25: battery and network where the browser reports them, nothing otherwise.
export function StatusIcons() {
  const battery = useBattery();
  const network = useNetwork();
  return (
    <span className="flex items-center gap-2">
      {!network.online ? (
        <span className="text-xs">Offline</span>
      ) : (
        network.type && (
          <span className="text-xs uppercase opacity-80" title={`Network: ${network.type}`}>
            {network.type}
          </span>
        )
      )}
      {battery && (
        <span className="flex items-center gap-1 text-xs tabular-nums" title={battery.charging ? "Charging" : "Battery"}>
          {Math.round(battery.level * 100)}%
          <span aria-hidden className="relative h-2.5 w-5 rounded-[3px] border border-current p-[1px]">
            <span className="block h-full rounded-[1px] bg-current" style={{ width: `${Math.max(8, battery.level * 100)}%` }} />
          </span>
          {battery.charging && <span aria-hidden>⚡</span>}
        </span>
      )}
    </span>
  );
}
