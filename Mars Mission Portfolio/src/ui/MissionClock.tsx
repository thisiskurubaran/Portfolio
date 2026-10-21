"use client";

import { useEffect, useState } from "react";
import { ui } from "@/content/ui";
import { missionElapsed, simNow } from "@/state/simClock";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function formatUtc(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
}

type Reading = { utc: string; met: string };

function read(): Reading {
  return { utc: formatUtc(simNow()), met: formatElapsed(missionElapsed()) };
}

export function MissionClock() {
  // Null on the server and first client render, so the markup matches.
  const [reading, setReading] = useState<Reading | null>(null);

  useEffect(() => {
    const tick = () => setReading(read());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section className="hud-clock" aria-label={ui.clock.label}>
      <div>
        <span className="hud-key">{ui.clock.utc}</span>
        <time className="hud-value">{reading?.utc ?? "...."}</time>
      </div>
      <div>
        <span className="hud-key">{ui.clock.met}</span>
        {/* Seconds tick every second; announcing each would flood screen readers. */}
        <span className="hud-value" aria-live="off">
          {reading?.met ?? "00:00:00"}
        </span>
      </div>
      <details className="hud-scale">
        <summary>{ui.clock.scale}</summary>
        <p>{ui.clock.scaleNote}</p>
      </details>
    </section>
  );
}
