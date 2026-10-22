"use client";

import type { ReactNode } from "react";
import { Icon, type IconName } from "@/design/icons";
import { usePreferences, type ThemeMode } from "@/os/state/preferences";
import { ContinuityStrip } from "./ContinuityStrip";
import { PowerRow } from "./PowerRow";

const THEMES: { id: ThemeMode; label: string }[] = [
  { id: "system", label: "System" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "auto", label: "Auto" },
];

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`rounded-2xl p-3 text-left text-sm ${on ? "bg-accent text-on-accent" : "bg-glass"}`}
    >
      {label}
      <span className="block text-xs opacity-70">{on ? "On" : "Off"}</span>
    </button>
  );
}

function Slider({ label, icon, min, value, onChange }: { label: string; icon: IconName; min: number; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex items-center gap-3 text-sm">
      <Icon name={icon} size={16} className="shrink-0 text-muted" />
      <span className="sr-only">{label}</span>
      <input
        type="range"
        min={min}
        max={1}
        step={0.05}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={`${Math.round(value * 100)}%`}
        className="h-1.5 flex-1 cursor-pointer accent-[var(--color-accent)]"
      />
      <span className="w-9 text-right text-xs tabular-nums text-muted">{Math.round(value * 100)}%</span>
    </label>
  );
}

// The control center body shared by the touch shells: theme, motion, sound,
// the device switcher and the plain view. Each shell adds its own actions.
export function QuickSettings({ actions, onLock, onDone }: { actions?: ReactNode; onLock?: () => void; onDone?: () => void }) {
  const prefs = usePreferences();
  return (
    <>
      <h2 className="mb-3 text-sm font-semibold text-muted">Control center</h2>
      <div role="radiogroup" aria-label="Theme" className="grid grid-cols-4 gap-2">
        {THEMES.map((t) => (
          <button
            key={t.id}
            role="radio"
            aria-checked={prefs.theme === t.id}
            onClick={() => prefs.setTheme(t.id)}
            className={`rounded-2xl px-1 py-3 text-sm ${prefs.theme === t.id ? "bg-accent text-on-accent" : "bg-glass"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Toggle label="Sound" on={prefs.sound} onChange={prefs.setSound} />
        <Toggle label="Focus" on={prefs.focus} onChange={(focus) => prefs.update({ focus })} />
        <Toggle label="Night light" on={prefs.nightLight} onChange={(nightLight) => prefs.update({ nightLight })} />
        <Toggle label="Reduce motion" on={prefs.reducedMotion} onChange={prefs.setReducedMotion} />
      </div>
      <div className="mt-3 space-y-2 rounded-2xl bg-glass p-3">
        <Slider label="Brightness" icon="sun" min={0.4} value={prefs.brightness} onChange={(brightness) => prefs.update({ brightness })} />
        <Slider label="Volume" icon="bell" min={0} value={prefs.volume} onChange={(volume) => prefs.update({ volume, sound: volume > 0 ? true : prefs.sound })} />
      </div>
      <h3 className="mb-2 mt-4 text-xs font-medium uppercase tracking-wide text-muted">Open as</h3>
      <ContinuityStrip compact />
      <div className="mt-4 grid grid-cols-3 gap-2">
        {actions}
        <a href="/plain" className="rounded-2xl bg-glass p-3 text-center text-sm">
          Plain view
        </a>
      </div>
      {onLock && (
        <div className="mt-4">
          <PowerRow onLock={onLock} onDone={onDone} />
        </div>
      )}
    </>
  );
}
