"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ui } from "@/content/ui";
import { useSceneStore } from "@/state/store";
import { PRESETS, type PresetId } from "@/weather/presets";
import { majorStormName } from "@/weather/region";
import type { Weather } from "@/weather/schema";

type Word = keyof typeof ui.weatherWords;

function codeToWord(code: number): Word {
  if (code === 0) return "clear";
  if (code <= 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "drizzle";
  if (code >= 61 && code <= 67) return "rain";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (code >= 80 && code <= 82) return "showers";
  return code >= 95 ? "thunder" : "cloudy";
}

function liveLine(city: string | null, w: Weather): string {
  const parts = [ui.weatherWords[codeToWord(w.code)], `${Math.round(w.windSpeed)} ${ui.barometer.wind}`, `${Math.round(w.temperature)}°C`];
  return `${city ? `${city}: ` : ""}${parts.join(", ")}`;
}

/** F18: lets a visitor pick the weather for themselves. Kept in memory only. */
export function Barometer() {
  const [open, setOpen] = useState(false);
  const preset = useSceneStore((s) => s.weatherPreset);
  const conditions = useSceneStore((s) => s.conditions);
  const calm = useSceneStore((s) => s.calmForRealStorm);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const id = useId();

  const majorName = ui.barometer.presets.major[majorStormName(conditions?.location?.lat ?? null, conditions?.location?.lon ?? null)];
  const label = (p: PresetId) => (p === "major" ? majorName : ui.barometer.presets[p]);
  const current = preset ? label(preset) : ui.barometer.live;

  useEffect(() => {
    if (!open) return;
    popRef.current?.querySelector<HTMLInputElement>("input:checked")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const choose = (value: PresetId | null) => useSceneStore.getState().setWeatherPreset(value);

  return (
    <div className="barometer">
      <button
        ref={buttonRef}
        type="button"
        className="corner-button barometer-button"
        aria-expanded={open}
        aria-controls={`${id}-pop`}
        onClick={() => setOpen((o) => !o)}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <path d="M8 8 L11 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span>
          {ui.barometer.button}: {current}
        </span>
      </button>

      {calm && !preset && (
        <p className="barometer-note" role="status">
          {ui.storm.calmNote}
        </p>
      )}

      <div id={`${id}-pop`} ref={popRef} className="barometer-pop" hidden={!open}>
        <fieldset>
          <legend>{ui.barometer.legend}</legend>
          <label>
            <input type="radio" name={`${id}-w`} checked={preset === null} onChange={() => choose(null)} />
            <span>
              {ui.barometer.live}
              <small>
                {conditions?.weather ? liveLine(conditions.location?.city ?? null, conditions.weather) : ui.barometer.liveFallback}
              </small>
            </span>
          </label>
          {(Object.keys(PRESETS) as PresetId[]).map((p) => (
            <label key={p}>
              <input type="radio" name={`${id}-w`} checked={preset === p} onChange={() => choose(p)} />
              <span>{label(p)}</span>
            </label>
          ))}
        </fieldset>
        <p className="barometer-resets">{ui.barometer.resets}</p>
      </div>
    </div>
  );
}
