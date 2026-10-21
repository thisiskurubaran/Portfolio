"use client";

import { useEffect, useState } from "react";
import { Vector3 } from "three";
import { skillGroups } from "@/content/skills";
import { ui } from "@/content/ui";
import { orbitalPeriod } from "@/physics/kepler";
import { frame, MU_EARTH_KM, orbit } from "@/scene/missionRuntime";
import { EARTH_RADIUS_KM } from "@/scene/scale";
import { sky } from "@/scene/skyRuntime";
import { TransferPlanner } from "./TransferPlanner";

type Reading = { alt: string; vel: string; per: string; inc: string };

const h = new Vector3();

function read(): Reading {
  const alt = frame.originKm.length() - EARTH_RADIUS_KM;
  const period = orbit.elements ? orbitalPeriod(orbit.elements.a, MU_EARTH_KM) / 60 : 0;
  // Inclination to Earth's equator, not to the ecliptic the scene uses.
  h.crossVectors(frame.originKm, frame.velocityKmS).normalize();
  const inc = (Math.acos(Math.min(Math.max(h.dot(sky.earthPole), -1), 1)) * 180) / Math.PI;
  return {
    alt: `${alt.toFixed(1)} km`,
    vel: `${frame.velocityKmS.length().toFixed(3)} km/s`,
    per: `${period.toFixed(1)} min`,
    inc: `${inc.toFixed(1)}°`,
  };
}

function Telemetry() {
  const [r, setR] = useState<Reading | null>(null);

  useEffect(() => {
    const tick = () => setR(read());
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, []);

  const rows: [string, string | undefined][] = [
    [ui.telemetry.altitude, r?.alt],
    [ui.telemetry.speed, r?.vel],
    [ui.telemetry.period, r?.per],
    [ui.telemetry.inclination, r?.inc],
  ];
  return (
    <section className="panel telemetry orbit-telemetry" aria-label={ui.telemetry.label}>
      {rows.map(([k, v]) => (
        <div key={k}>
          <span className="hud-key">{k}</span>
          <span className="hud-value">{v ?? "...."}</span>
        </div>
      ))}
    </section>
  );
}

/** Phase 2: skills as instrument panels, one system per group. */
function Instruments() {
  const [open, setOpen] = useState(skillGroups[0]!.id);
  const group = skillGroups.find((g) => g.id === open) ?? skillGroups[0]!;
  // Starts open on wide screens; on phones it would cover the ship, so it starts closed.
  const [expanded] = useState(() => window.matchMedia("(min-width: 641px)").matches);

  return (
    <details className="panel instruments" open={expanded}>
      <summary className="panel-kicker">{ui.skills.label}</summary>
      <p className="instruments-hint">{ui.skills.hint}</p>
      <div className="instrument-tabs" role="group" aria-label={ui.skills.label}>
        {skillGroups.map((g) => (
          <button
            key={g.id}
            type="button"
            className="hud-button small"
            aria-pressed={g.id === open}
            onClick={() => setOpen(g.id)}
          >
            {g.name}
          </button>
        ))}
      </div>
      <ul className="instrument-readout" aria-label={group.name}>
        {group.skills.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
    </details>
  );
}

export function OrbitHud() {
  return (
    <>
      <Telemetry />
      <Instruments />
      <TransferPlanner />
    </>
  );
}
