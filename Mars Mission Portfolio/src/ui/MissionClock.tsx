"use client";

import { useEffect, useState } from "react";
import { ui } from "@/content/ui";
import { lightTimeSeconds } from "@/physics/lightTimeDelay";
import { sub } from "@/physics/vec";
import { heliocentric } from "@/space/elements";
import { observer } from "@/state/observer";
import { simNow } from "@/state/simClock";
import { useStore } from "@/state/store";
import { formatDistance, formatDuration, formatElapsed, formatUtc } from "./format";

/** Mission elapsed time from liftoff, in mission (simulated) time. */
function formatMet(t: number): string {
  const liftoff = useStore.getState().liftoffMs;
  if (liftoff === null) return "--:--:--";
  const ms = Math.max(t - liftoff, 0);
  const days = Math.floor(ms / 86_400_000);
  const rest = formatElapsed(ms % 86_400_000);
  return days > 0 ? `${days}d ${rest}` : rest;
}

type Reading = { utc: string; met: string; mars: string; signal: string; signalNote: string };

function read(): Reading {
  const t = simNow();
  // Computed here rather than read from the scene so the HUD still works
  // when WebGL is missing.
  const earth = heliocentric("earth", t).r;
  const mars = heliocentric("mars", t).r;
  const ship = observer.au;
  const marsAu = Math.hypot(...sub(mars, ship ?? earth));
  // Before departure the delay that matters is Earth to Mars; after it, ship to mission control.
  const signalAu = ship ? Math.hypot(...sub(ship, earth)) : marsAu;
  return {
    utc: formatUtc(t),
    met: formatMet(t),
    mars: formatDistance(marsAu),
    signal: formatDuration(lightTimeSeconds(signalAu)),
    signalNote: ship ? ui.clock.signalNoteShip : ui.clock.signalNote,
  };
}

export function MissionClock() {
  // Null on the server and first client render, so the markup matches.
  const [reading, setReading] = useState<Reading | null>(null);
  const warp = useStore((s) => s.warp);

  useEffect(() => {
    const tick = () => setReading(read());
    tick();
    // Under warp the date moves fast enough that a 1 s refresh looks stuck.
    const id = window.setInterval(tick, warp > 1 ? 100 : 1000);
    return () => window.clearInterval(id);
  }, [warp]);

  return (
    <section className="hud-clock" aria-label={ui.clock.label}>
      <div>
        <span className="hud-key">{ui.clock.utc}</span>
        <time className="hud-value">{reading?.utc ?? "...."}</time>
      </div>
      <div>
        <span className="hud-key">{ui.clock.met}</span>
        <span className="hud-value">{reading?.met ?? "--:--:--"}</span>
      </div>
      <div>
        <span className="hud-key">{ui.clock.mars}</span>
        <span className="hud-value">{reading?.mars ?? "...."}</span>
      </div>
      <div title={reading?.signalNote ?? ui.clock.signalNote}>
        <span className="hud-key">{ui.clock.signal}</span>
        <span className="hud-value">{reading?.signal ?? "...."}</span>
      </div>
      <details className="hud-scale">
        <summary>{ui.clock.scale}</summary>
        <p>{ui.clock.scaleNote}</p>
      </details>
    </section>
  );
}
