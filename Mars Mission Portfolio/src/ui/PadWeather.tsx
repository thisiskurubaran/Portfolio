"use client";

import { useEffect, useState } from "react";
import { ui } from "@/content/ui";
import { simNow } from "@/state/simClock";
import { useConditions } from "@/state/conditions";
import { describe, nextClearSlot, violations } from "@/weather/launchRules";

export type LaunchCall = { go: true } | { go: false; slotMs: number | null; reasons: string[] };

/** F02: go or hold from the pad's real weather, and when the next clear slot is. */
export function useLaunchCall(): LaunchCall {
  const pad = useConditions((s) => s.conditions?.pad);
  const [now, setNow] = useState(0);
  const [real, setReal] = useState(0);
  useEffect(() => {
    const tick = () => {
      setNow(simNow());
      setReal(Date.now());
    };
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);
  // Weather only describes today; once time has been warped far past it, there is nothing to hold for.
  const fresh = pad?.weather && now > 0 && Math.abs(now - real) < 3 * 3_600_000;
  if (!pad?.weather || !fresh) return { go: true };
  const v = violations(pad.weather);
  if (v.length === 0) return { go: true };
  return { go: false, slotMs: nextClearSlot(pad.forecast, now), reasons: v.map((r) => ui.weather.reasons[r]) };
}

function localTime(ms: number): string {
  return new Intl.DateTimeFormat(undefined, { weekday: "short", hour: "2-digit", minute: "2-digit" }).format(ms);
}

export function PadWeather({ call }: { call: LaunchCall }) {
  const c = useConditions((s) => s.conditions);
  const w = c?.pad.weather;
  const mine = c?.visitor;
  return (
    <div className="pad-weather">
      {w ? (
        <p>
          <strong>{ui.weather.pad}</strong> {describe(w.code)}, {Math.round(w.temperature)}°C, {ui.weather.gusts(w.gusts)}.{" "}
          <strong className={call.go ? "go" : "hold"}>{call.go ? ui.weather.go : ui.weather.hold}</strong>
          {!call.go && (
            <>
              {" "}
              {call.reasons.join(", ")}.{" "}
              {call.slotMs ? ui.weather.slot(localTime(call.slotMs)) : ui.weather.noSlot}
            </>
          )}
        </p>
      ) : (
        <p className="planner-note">{ui.weather.unknown}</p>
      )}
      {mine?.weather && (
        <p className="planner-note">
          {ui.weather.yours(mine.place.city ?? ui.weather.yourCity)} {describe(mine.weather.code).toLowerCase()},{" "}
          {Math.round(mine.weather.temperature)}°C.
        </p>
      )}
    </div>
  );
}
