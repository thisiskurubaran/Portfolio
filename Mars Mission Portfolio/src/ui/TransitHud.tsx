"use client";

import { useEffect, useState } from "react";
import { type StopId, stops } from "@/content/stops";
import { ui } from "@/content/ui";
import { AU_KM } from "@/physics/constants";
import { SHIP } from "@/physics/ship";
import { frame } from "@/scene/missionRuntime";
import { sky } from "@/scene/skyRuntime";
import { distanceToStop, forceStop, transit, visitLabel } from "@/scene/transitRuntime";
import { simNow } from "@/state/simClock";
import { useStore } from "@/state/store";
import { toNextStation } from "./missionActions";
import { DockBar } from "./DockBar";

const DAY = 86_400_000;

type Reading = { sun: string; vel: string; mars: string; eta: string; fuel: string };

function read(): Reading {
  const p = transit.shipHelioKm;
  const plan = transit.plan;
  const fuel = transit.propellantKg / (SHIP.wetKg - SHIP.dryKg);
  return {
    sun: `${(p.length() / AU_KM).toFixed(3)} AU`,
    vel: `${frame.velocityKmS.length().toFixed(2)} km/s`,
    mars: `${((sky.planets.mars.distanceAu * AU_KM) / 1e6).toFixed(1)}M km`,
    eta: plan ? ui.transit.days((plan.arriveMs - simNow()) / DAY) : "",
    fuel: `${Math.round(fuel * 100)}%`,
  };
}

function Telemetry() {
  const [r, setR] = useState<Reading | null>(null);
  useEffect(() => {
    const tick = () => setR(read());
    tick();
    const id = window.setInterval(tick, 200);
    return () => window.clearInterval(id);
  }, []);
  const rows: [string, string | undefined][] = [
    [ui.transit.sun, r?.sun],
    ["VEL", r?.vel],
    [ui.transit.mars, r?.mars],
    [ui.transit.eta, r?.eta],
    [ui.transit.fuel, r?.fuel],
  ];
  return (
    <section className="panel telemetry orbit-telemetry" aria-label={ui.transit.label}>
      {rows.map(([k, v]) => (
        <div key={k}>
          <span className="hud-key">{k}</span>
          <span className="hud-value">{v ?? "...."}</span>
        </div>
      ))}
    </section>
  );
}

function Timeline() {
  const index = useStore((s) => s.visitIndex);
  const mode = useStore((s) => s.transitMode);
  const [now, setNow] = useState(() => simNow());
  const [, setRevision] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setNow(simNow()), 250);
    return () => window.clearInterval(id);
  }, []);

  const offPath = stops.filter((s) => {
    const st = transit.stopStatus[s.id];
    return st && !st.available && !st.forced && st.tMs !== null && st.tMs > now;
  });
  const override = (id: StopId) => {
    forceStop(id);
    setRevision((r) => r + 1);
  };

  return (
    <section className="panel timeline" aria-label={ui.transit.stations}>
      <p className="panel-kicker">{ui.transit.stations}</p>
      <ol>
        {transit.visits.map((v, i) => {
          const here = i === index && mode !== "cruise";
          const status =
            i < index
              ? ui.transit.visited
              : here
                ? ui.transit.here
                : v.kind === "stop"
                  ? ui.transit.km(distanceToStop(v.stop, now))
                  : ui.transit.days((v.tMs - now) / DAY);
          return (
            <li key={v.id} className={here ? "current" : i < index ? "done" : ""}>
              <span>
                {visitLabel(v).name}
                {v.kind === "stop" && <span className="timeline-tag">{ui.transit.stop}</span>}
              </span>
              <span className="timeline-status">{status}</span>
            </li>
          );
        })}
        {offPath.map((s) => (
          <li key={s.id} className="off-path">
            <span>
              {s.name}
              <span className="timeline-tag">{ui.transit.offPath}</span>
            </span>
            <button type="button" className="hud-button small" title={ui.transit.overrideNote} onClick={() => override(s.id)}>
              {ui.transit.override}
            </button>
          </li>
        ))}
      </ol>
      {mode === "cruise" && index < transit.visits.length && (
        <button type="button" className="hud-button" onClick={toNextStation}>
          {ui.transit.next}
        </button>
      )}
    </section>
  );
}

export function TransitHud() {
  return (
    <>
      <Telemetry />
      <Timeline />
      <DockBar />
    </>
  );
}

export function TmiHud() {
  return (
    <p className="panel dock-bar" role="status">
      <strong>{ui.tmi.label}.</strong> {ui.tmi.note}
    </p>
  );
}
