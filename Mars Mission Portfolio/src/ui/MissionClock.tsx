"use client";

import { useEffect, useState } from "react";
import { ui } from "@/content/ui";
import { lightTimeSeconds } from "@/physics/lightTimeDelay";
import { sub } from "@/physics/vec";
import { heliocentric } from "@/space/elements";
import { missionElapsed, simNow } from "@/state/simClock";
import { useStore } from "@/state/store";
import { formatDistance, formatDuration, formatElapsed, formatUtc } from "./format";

type Reading = { utc: string; met: string; mars: string; signal: string };

function read(): Reading {
  const t = simNow();
  // Computed here rather than read from the scene so the HUD still works
  // when WebGL is missing.
  const marsAu = Math.hypot(...sub(heliocentric("mars", t).r, heliocentric("earth", t).r));
  return {
    utc: formatUtc(t),
    met: formatElapsed(missionElapsed()),
    mars: formatDistance(marsAu),
    signal: formatDuration(lightTimeSeconds(marsAu)),
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
        <span className="hud-value">{reading?.met ?? "00:00:00"}</span>
      </div>
      <div>
        <span className="hud-key">{ui.clock.mars}</span>
        <span className="hud-value">{reading?.mars ?? "...."}</span>
      </div>
      <div title={ui.clock.signalNote}>
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
