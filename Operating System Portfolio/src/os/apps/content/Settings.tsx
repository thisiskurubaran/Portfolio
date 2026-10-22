"use client";

import type { ReactNode } from "react";
import { privacy } from "@/content/privacy";
import { accents, wallpaperBackground, wallpapers } from "@/design/wallpapers";
import { usePreferences, type ThemeMode } from "@/os/state/preferences";
import { useDaypart } from "@/os/system/daypart";
import { useResolvedTheme } from "@/os/system/useSystemAttributes";
import { ContinuityStrip } from "@/shells/shared/ContinuityStrip";
import { ThreatPanel } from "./ThreatPanel";

const THEMES: { id: ThemeMode; label: string; hint: string }[] = [
  { id: "system", label: "System", hint: "Follow this device" },
  { id: "light", label: "Light", hint: "Always light" },
  { id: "dark", label: "Dark", hint: "Always dark" },
  { id: "auto", label: "Auto", hint: "Light by day, dark at night" },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="space-y-3">
      <h2 className="text-xs font-medium uppercase tracking-wide opacity-60">{title}</h2>
      {children}
    </section>
  );
}

function Switch({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button role="switch" aria-checked={on} onClick={() => onChange(!on)} className="flex w-full items-center justify-between rounded-control bg-glass px-4 py-3 text-sm">
      {label}
      <span aria-hidden className={`relative h-6 w-10 rounded-full transition-colors ${on ? "bg-accent" : "bg-glass-strong"}`}>
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-paper transition-all ${on ? "left-5" : "left-1"}`} />
      </span>
    </button>
  );
}

// F08: appearance, motion, sound, device and privacy, all saved locally (F09).
export default function Settings() {
  const prefs = usePreferences();
  const theme = useResolvedTheme();
  const daypart = useDaypart();
  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <Section title="Appearance">
        <div role="radiogroup" aria-label="Theme" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {THEMES.map((t) => (
            <button
              key={t.id}
              role="radio"
              aria-checked={prefs.theme === t.id}
              onClick={() => prefs.setTheme(t.id)}
              className={`rounded-control p-3 text-left text-sm ${prefs.theme === t.id ? "bg-accent text-on-accent" : "bg-glass"}`}
            >
              {t.label}
              <span className="block text-xs opacity-75">{t.hint}</span>
            </button>
          ))}
        </div>
        <div role="radiogroup" aria-label="Accent colour" className="flex flex-wrap gap-3">
          {accents.map((c) => (
            <button
              key={c}
              role="radio"
              aria-checked={prefs.accent === c}
              aria-label={`Accent ${c}`}
              onClick={() => prefs.setAccent(c)}
              className={`h-8 w-8 rounded-full ring-offset-2 ring-offset-ink ${prefs.accent === c ? "ring-2 ring-paper" : ""}`}
              style={{ background: c }}
            />
          ))}
        </div>
        <div role="radiogroup" aria-label="Wallpaper" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {wallpapers.map((w) => (
            <button
              key={w.id}
              role="radio"
              aria-checked={prefs.wallpaper === w.id}
              onClick={() => prefs.setWallpaper(w.id)}
              className={`overflow-hidden rounded-control text-left text-xs ${prefs.wallpaper === w.id ? "ring-2 ring-accent" : ""}`}
            >
              <span aria-hidden className="block h-16" style={{ background: wallpaperBackground(w.id, theme, daypart) }} />
              <span className="block bg-glass px-2 py-1.5">
                {w.name}
                {w.id === "dynamic" && daypart && <span className="opacity-60">, {daypart}</span>}
              </span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Accessibility and sound">
        <Switch label="Reduce motion" on={prefs.reducedMotion} onChange={prefs.setReducedMotion} />
        <Switch label="Sound" on={prefs.sound} onChange={prefs.setSound} />
      </Section>

      <Section title="Device">
        <p className="text-sm opacity-75">Open the same portfolio as another kbOS device.</p>
        <ContinuityStrip />
      </Section>

      <Section title="Security">
        <ThreatPanel />
      </Section>

      <Section title="Privacy">
        <p className="text-sm leading-relaxed opacity-85">{privacy.intro}</p>
        <ul className="space-y-2 text-sm">
          {privacy.stored.map((item) => (
            <li key={item.what} className="rounded-control bg-glass p-3">
              <span className="font-medium">{item.what}</span>
              <span className="block text-xs opacity-70">{item.where}</span>
            </li>
          ))}
        </ul>
        <a href="/privacy" className="inline-block text-sm text-accent-fg underline">
          Read the full privacy page
        </a>
      </Section>
    </div>
  );
}
