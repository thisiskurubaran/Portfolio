"use client";

import { useEffect, useState } from "react";
import { ui } from "@/content/ui";
import { endHold, holdProgress, rescue, rescueNeeded, startHold } from "@/scene/weather/rescue";
import { simNow } from "@/state/simClock";

/** F09: what to do, the hold progress, and a button for keyboard and touch. */
export function RescueHud() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 100);
    return () => window.clearInterval(id);
  }, []);
  const needed = rescueNeeded(simNow());
  if (!needed && !rescue.done) return null;
  const p = holdProgress();
  if (p >= 1 && !rescue.done) endHold();
  return (
    <section className="panel rescue" aria-label={ui.rescue.label}>
      <p className="panel-kicker">{ui.rescue.label}</p>
      {rescue.done ? (
        <p role="status">{ui.rescue.done}</p>
      ) : (
        <>
          <p>{ui.rescue.brief}</p>
          <button
            type="button"
            className="hud-button"
            onPointerDown={startHold}
            onPointerUp={endHold}
            onPointerLeave={endHold}
            onKeyDown={(e) => {
              if ((e.key === " " || e.key === "Enter") && !e.repeat) {
                e.preventDefault();
                startHold();
              }
            }}
            onKeyUp={endHold}
          >
            {ui.rescue.hold}
          </button>
          <progress max={1} value={p} aria-label={ui.rescue.progress} />
        </>
      )}
    </section>
  );
}
