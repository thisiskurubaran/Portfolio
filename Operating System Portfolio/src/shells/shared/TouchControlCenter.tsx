"use client";

import { useEffect, useRef, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { experience } from "@/content";
import { Icon, type IconName } from "@/design/icons";
import { usePreferences, type ThemeMode } from "@/os/state/preferences";
import { haptic } from "@/os/system/haptics";
import { launch } from "@/os/system/launcher";
import { leaveTo } from "@/os/system/navigate";
import { useSystem } from "@/os/system/systemState";
import { useWeather } from "@/os/system/weather";
import { describeWeather } from "@/os/system/weatherTypes";
import { ContinuityStrip } from "./ContinuityStrip";
import { useFocusTrap } from "./useFocusTrap";
import { useSwipe } from "./useSwipe";

const tile = "mat-regular rounded-[26px] text-paper";

function RoundToggle({ label, icon, on, onToggle, tint }: { label: string; icon: IconName; on: boolean; onToggle: () => void; tint: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      title={label}
      onClick={() => {
        haptic();
        onToggle();
      }}
      className="flex h-[54px] w-[54px] items-center justify-center rounded-full transition-colors"
      style={{ background: on ? tint : "rgb(255 255 255 / 0.16)", color: "#ffffff" }}
    >
      <Icon name={icon} size={22} weight={2} />
    </button>
  );
}

// A tall slider like a real control center: drag up or down, or use the arrow keys.
function TallSlider({ label, icon, value, min, onChange }: { label: string; icon: IconName; value: number; min: number; onChange: (v: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const set = (clientY: number) => {
    const r = ref.current!.getBoundingClientRect();
    const v = 1 - (clientY - r.top) / r.height;
    onChange(Math.min(1, Math.max(min, Math.round(v * 20) / 20)));
  };
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    set(e.clientY);
  };
  const onKeyDown = (e: KeyboardEvent) => {
    const step = e.key === "ArrowUp" || e.key === "ArrowRight" ? 0.05 : e.key === "ArrowDown" || e.key === "ArrowLeft" ? -0.05 : 0;
    if (!step) return;
    e.preventDefault();
    onChange(Math.min(1, Math.max(min, Math.round((value + step) * 20) / 20)));
  };
  const pct = ((value - min) / (1 - min)) * 100;
  return (
    <div
      ref={ref}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={Math.round(min * 100)}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      onPointerDown={onPointerDown}
      onPointerMove={(e) => e.buttons === 1 && set(e.clientY)}
      onKeyDown={onKeyDown}
      className="relative row-span-2 h-full touch-none overflow-hidden rounded-[26px] bg-white/[0.16]"
    >
      <div className="absolute inset-x-0 bottom-0 bg-white" style={{ height: `${Math.max(8, pct)}%` }} />
      <Icon name={icon} size={22} weight={2} className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[#6b6b73]" />
    </div>
  );
}

function SmallTile({ label, icon, onClick, children }: { label: string; icon: IconName; onClick: () => void; children?: ReactNode }) {
  return (
    <button onClick={onClick} aria-label={label} className={`${tile} flex flex-col items-center justify-center gap-1 text-[11px] font-medium`}>
      <Icon name={icon} size={22} weight={2} />
      {children}
    </button>
  );
}

const THEME_ORDER: ThemeMode[] = ["system", "light", "dark", "auto"];
const THEME_LABEL: Record<ThemeMode, string> = { system: "System", light: "Light", dark: "Dark", auto: "Auto" };

// The control center for the touch shells: a full-screen frosted layer with
// a grid of tiles. Swipe up, tap outside or press Escape to close.
export function TouchControlCenter({ onClose, onLock, onRecents }: { onClose: () => void; onLock: () => void; onRecents?: () => void }) {
  const prefs = usePreferences();
  const { sleep, restart, shutDown } = useSystem();
  const { weather } = useWeather();
  const current = experience[0]!;
  const ref = useRef<HTMLDivElement>(null);
  const trap = useFocusTrap(ref);
  const swipe = useSwipe((dir) => dir === "up" && onClose());
  useEffect(() => {
    ref.current?.focus();
  }, []);

  const run = (fn: () => void) => () => {
    onClose();
    fn();
  };

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Control center"
      onKeyDown={(e) => (e.key === "Escape" ? onClose() : trap(e))}
      {...swipe}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="folio-fade-in absolute inset-0 z-[12000] overflow-y-auto bg-black/35 px-5 pb-8 pt-14 outline-none backdrop-blur-2xl backdrop-saturate-150"
    >
      <div className="mx-auto grid max-w-sm auto-rows-[74px] grid-cols-4 gap-3.5" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className={`${tile} col-span-2 row-span-2 grid grid-cols-2 place-items-center p-3`}>
          <RoundToggle label="Sound" icon="bell" on={prefs.sound} tint="#ff9230" onToggle={() => prefs.setSound(!prefs.sound)} />
          <RoundToggle label="Focus" icon="moon" on={prefs.focus} tint="#6f6cff" onToggle={() => prefs.update({ focus: !prefs.focus })} />
          <RoundToggle label="Night light" icon="sun" on={prefs.nightLight} tint="#ff9230" onToggle={() => prefs.update({ nightLight: !prefs.nightLight })} />
          <RoundToggle label="Reduce motion" icon="restore" on={prefs.reducedMotion} tint="#3d8bff" onToggle={() => prefs.setReducedMotion(!prefs.reducedMotion)} />
        </div>

        <button onClick={run(() => launch("experience"))} className={`${tile} col-span-2 row-span-2 flex flex-col justify-between p-4 text-left`}>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">{weather ? weather.city ?? "Weather" : "Now"}</span>
          {weather ? (
            <span>
              <span className="block text-[34px] font-semibold leading-none">{weather.temperature}°</span>
              <span className="mt-1 block text-[13px] text-muted">{describeWeather(weather.code)}</span>
            </span>
          ) : (
            <span>
              <span className="line-clamp-2 block text-[15px] font-semibold leading-snug">{current.title.split(" (")[0]}</span>
              <span className="mt-1 block truncate text-[13px] text-muted">{current.company}</span>
            </span>
          )}
        </button>

        <button
          onClick={() => prefs.setTheme(THEME_ORDER[(THEME_ORDER.indexOf(prefs.theme) + 1) % THEME_ORDER.length]!)}
          aria-label={`Appearance: ${THEME_LABEL[prefs.theme]}. Tap to change.`}
          className={`${tile} col-span-2 flex items-center gap-3 px-4 text-left`}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.16]">
            <Icon name={prefs.theme === "light" ? "sun" : "moon"} size={18} weight={2} />
          </span>
          <span>
            <span className="block text-[13px] font-semibold">Appearance</span>
            <span className="block text-[12px] text-muted">{THEME_LABEL[prefs.theme]}</span>
          </span>
        </button>
        <TallSlider label="Brightness" icon="sun" min={0.4} value={prefs.brightness} onChange={(brightness) => prefs.update({ brightness })} />
        <TallSlider label="Volume" icon="bell" min={0} value={prefs.volume} onChange={(volume) => prefs.update({ volume, sound: volume > 0 ? true : prefs.sound })} />

        <SmallTile label="Lock" icon="lock" onClick={run(onLock)} />
        <SmallTile label={onRecents ? "Recent apps" : "Settings"} icon={onRecents ? "windows" : "settings"} onClick={run(onRecents ?? (() => launch("settings")))} />

        <div className={`${tile} col-span-4 row-span-1 flex items-center px-3`}>
          <div className="w-full">
            <ContinuityStrip compact />
          </div>
        </div>

        <SmallTile label="Plain view" icon="notes" onClick={() => leaveTo("/plain")}>
          Plain
        </SmallTile>
        <SmallTile label="Sleep" icon="moon" onClick={run(sleep)}>
          Sleep
        </SmallTile>
        <SmallTile label="Restart" icon="restart" onClick={run(restart)}>
          Restart
        </SmallTile>
        <SmallTile label="Shut down" icon="power" onClick={run(shutDown)}>
          Off
        </SmallTile>
      </div>
    </div>
  );
}
