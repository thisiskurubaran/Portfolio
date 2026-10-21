"use client";

import { useEffect, useState } from "react";
import { ui } from "@/content/ui";
import { activeShowers } from "@/space/meteors";
import { gScale } from "@/space/spaceWeather";
import { effective, useConditions } from "@/state/conditions";
import { simNow } from "@/state/simClock";
import { useStore } from "@/state/store";

/**
 * F03 and F05: a calm, factual readout of space weather that matters to
 * the crew. Live events are informational; staged ones say they are staged.
 */
export function SpaceWeatherHud() {
  const mode = useConditions((s) => s.mode);
  const sw = useConditions((s) => s.spaceWeather);
  const dramatic = useConditions((s) => s.dramatic);
  const phase = useStore((s) => s.phase);
  const [now, setNow] = useState(0);
  useEffect(() => {
    const tick = () => setNow(simNow());
    tick();
    const id = window.setInterval(tick, 5000);
    return () => window.clearInterval(id);
  }, []);
  if (now === 0) return null;

  const showers = activeShowers(now);
  const e = effective(mode, sw, showers.length > 0, dramatic);
  const g = gScale(e.kp);
  const atMars = phase === "capture" || phase === "marsOrbit" || phase === "descent" || phase === "surface";
  const lines: string[] = [];
  const tags: string[] = [];
  if (e.radiation > 0) {
    lines.push(ui.spaceWeather.radiation(e.radiation));
    tags.push(`S${e.radiation}`);
  }
  if (e.blackout > 0) {
    lines.push(ui.spaceWeather.blackout(e.blackout));
    tags.push(`R${e.blackout}`);
  }
  if (g > 0 && !atMars) {
    lines.push(ui.spaceWeather.geomagnetic(g, e.kp));
    tags.push(`G${g}`);
  }
  if (e.dust && atMars) {
    lines.push(ui.spaceWeather.dust);
    tags.push(ui.spaceWeather.dustTag);
  }
  const shower = showers[0];
  if (e.meteors && phase === "orbit") {
    lines.push(shower ? ui.spaceWeather.shower(shower.shower.name, shower.shower.parent, Math.round(shower.rate)) : ui.spaceWeather.stagedShower);
    tags.push(shower ? shower.shower.name : ui.spaceWeather.meteorTag);
  }
  if (lines.length === 0) return null;
  return (
    // Collapsed by default: a calm one line summary, details on request.
    <details className="panel space-weather" aria-label={ui.spaceWeather.label}>
      <summary className="panel-kicker">
        {ui.spaceWeather.label}: {tags.join(", ")}
        {e.staged ? ` (${ui.spaceWeather.staged})` : sw?.source === "live" ? ` (${ui.spaceWeather.live})` : ""}
      </summary>
      {lines.map((l) => (
        <p key={l}>{l}</p>
      ))}
    </details>
  );
}
