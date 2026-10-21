"use client";

import { useEffect, useState } from "react";
import { bodies } from "@/content/bodies";
import { ui } from "@/content/ui";
import { lightTimeSeconds } from "@/physics/lightTimeDelay";
import { sub } from "@/physics/vec";
import { heliocentric } from "@/space/elements";
import { OTHER_PLANETS, type OtherPlanet } from "@/scene/skyRuntime";
import { simNow } from "@/state/simClock";
import { useStore } from "@/state/store";
import { formatDistance, formatDuration } from "./format";

function distanceFromEarth(id: OtherPlanet): number {
  const t = simNow();
  return Math.hypot(...sub(heliocentric(id, t).r, heliocentric("earth", t).r));
}

function Facts({ id }: { id: OtherPlanet }) {
  const facts = bodies[id];
  const selectBody = useStore((s) => s.selectBody);
  const [distance, setDistance] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setDistance(distanceFromEarth(id));
    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [id]);

  return (
    <div className="body-facts">
      <div className="body-head">
        <h2>{facts.name}</h2>
        <button type="button" className="hud-button" onClick={() => selectBody(null)}>
          {ui.bodies.close}
        </button>
      </div>
      <p>{facts.note}</p>
      <dl>
        <dt>{ui.bodies.distance}</dt>
        <dd>{distance === null ? "...." : formatDistance(distance)}</dd>
        <dt>{ui.bodies.lightTime}</dt>
        <dd>{distance === null ? "...." : formatDuration(lightTimeSeconds(distance))}</dd>
        <dt>{ui.bodies.radius}</dt>
        <dd>{facts.radiusKm.toLocaleString("en")} km</dd>
        <dt>{ui.bodies.year}</dt>
        <dd>{facts.periodDays.toLocaleString("en")} days</dd>
        <dt>{ui.bodies.day}</dt>
        <dd>{facts.day}</dd>
      </dl>
    </div>
  );
}

/** F06: real facts and live distance for the planet picked in the sky or from the list. */
export function BodyPanel() {
  const selected = useStore((s) => s.selectedBody);
  const selectBody = useStore((s) => s.selectBody);

  return (
    <section className="hud-bodies" aria-label={ui.bodies.listLabel}>
      <div className="body-list">
        {OTHER_PLANETS.map((id) => (
          <button
            key={id}
            type="button"
            className="hud-button"
            aria-pressed={selected === id}
            onClick={() => selectBody(selected === id ? null : id)}
          >
            {bodies[id].name}
          </button>
        ))}
      </div>
      {selected ? <Facts id={selected} /> : <p className="body-hint">{ui.bodies.tapHint}</p>}
    </section>
  );
}
