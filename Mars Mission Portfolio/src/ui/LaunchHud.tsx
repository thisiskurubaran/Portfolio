"use client";

import { useEffect, useState } from "react";
import { ui } from "@/content/ui";
import { currentEvent, type AscentEvent } from "@/scene/launch/ascentProfile";
import { ascent } from "@/scene/missionRuntime";
import { useStore } from "@/state/store";
import { formatElapsed } from "./format";
import { hold, skip } from "./missionActions";

function Countdown() {
  const endsAt = useStore((s) => s.countdownEndsAt);
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setLeft(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
    tick();
    const id = window.setInterval(tick, 100);
    return () => window.clearInterval(id);
  }, [endsAt]);

  return (
    <div className="countdown">
      {/* Announce each second of the final count; it is short and the point of the moment. */}
      <p className="countdown-value" role="timer" aria-live="polite" aria-label={ui.countdown.label}>
        {left === null ? "" : `T-${left}`}
      </p>
      <div className="brief-actions">
        <button type="button" className="hud-button" onClick={hold}>
          {ui.countdown.hold}
        </button>
        <button type="button" className="hud-button" onClick={skip}>
          {ui.brief.skip}
        </button>
      </div>
    </div>
  );
}

type Reading = { t: string; alt: string; vel: string; event: AscentEvent | null };

function read(): Reading {
  const s = ascent.sample;
  return {
    t: `T+${formatElapsed(Math.max(ascent.t, 0) * 1000)}`,
    alt: `${s.altitudeKm.toFixed(1)} km`,
    vel: `${s.speedKmS.toFixed(2)} km/s`,
    event: currentEvent(ascent.t),
  };
}

function Ascent() {
  const [r, setR] = useState<Reading | null>(null);
  const warp = useStore((s) => s.warp);

  useEffect(() => {
    const tick = () => setR(read());
    tick();
    const id = window.setInterval(tick, 100);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="ascent">
      <section className="panel telemetry" aria-label={ui.telemetry.label}>
        <p className="telemetry-t">{r?.t}</p>
        <div>
          <span className="hud-key">{ui.telemetry.altitude}</span>
          <span className="hud-value">{r?.alt}</span>
        </div>
        <div>
          <span className="hud-key">{ui.telemetry.speed}</span>
          <span className="hud-value">{r?.vel}</span>
        </div>
        {warp > 1 && <p className="telemetry-note">{`${warp}x. ${ui.telemetry.warpNote}`}</p>}
      </section>
      {/* Event callouts change every few seconds at most, so a polite live region is fine. */}
      <p className="event-callout" aria-live="polite">
        {r?.event ? ui.events[r.event] : ""}
      </p>
      <button type="button" className="hud-button ascent-skip" onClick={skip}>
        {ui.brief.skip}
      </button>
    </div>
  );
}

export function LaunchHud() {
  const phase = useStore((s) => s.phase);
  if (phase === "countdown") return <Countdown />;
  if (phase === "ascent") return <Ascent />;
  return null;
}
