"use client";

import { availableShells } from "@/os/device/shells";
import { useDevice } from "@/os/device/useDevice";
import { usePreferences, type ThemeMode } from "@/os/state/preferences";
import { Sheet } from "./Sheet";
import { usePhone } from "./state";

const THEMES: { id: ThemeMode; label: string }[] = [
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
      className={`rounded-2xl p-3 text-left text-sm ${on ? "bg-accent text-ink" : "bg-glass"}`}
    >
      {label}
      <span className="block text-xs opacity-70">{on ? "On" : "Off"}</span>
    </button>
  );
}

export function ControlCenter() {
  const setOverlay = usePhone((s) => s.setOverlay);
  const lock = usePhone((s) => s.lock);
  const prefs = usePreferences();
  const { shell, setOverride } = useDevice();
  return (
    <Sheet label="Control center" onClose={() => setOverlay(null)}>
      <h2 className="mb-3 text-sm font-medium opacity-70">Control center</h2>
      <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-2">
        {THEMES.map((t) => (
          <button
            key={t.id}
            role="radio"
            aria-checked={prefs.theme === t.id}
            onClick={() => prefs.setTheme(t.id)}
            className={`rounded-2xl p-3 text-sm ${prefs.theme === t.id ? "bg-accent text-ink" : "bg-glass"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Toggle label="Sound" on={prefs.sound} onChange={prefs.setSound} />
        <Toggle label="Reduce motion" on={prefs.reducedMotion} onChange={prefs.setReducedMotion} />
      </div>
      <h3 className="mb-2 mt-4 text-xs uppercase tracking-wide opacity-60">Open as</h3>
      <div className="grid grid-cols-2 gap-2">
        {availableShells.map((s) => (
          <button
            key={s.id}
            onClick={() => setOverride(s.id)}
            aria-pressed={shell === s.id}
            className={`rounded-2xl p-3 text-left text-sm ${shell === s.id ? "ring-2 ring-accent" : ""} bg-glass`}
          >
            {s.name}
            <span className="block text-xs opacity-70">{s.device}</span>
          </button>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <a href="/plain" className="rounded-2xl bg-glass p-3 text-center text-sm">
          Plain view
        </a>
        <button onClick={lock} className="rounded-2xl bg-glass p-3 text-sm">
          Lock
        </button>
      </div>
    </Sheet>
  );
}
