"use client";

import { useEffect, useRef, useState } from "react";
import { stations } from "@/content/stations";
import { ui } from "@/content/ui";
import { AU_KM } from "@/physics/constants";
import { SHIP } from "@/physics/ship";
import { frame } from "@/scene/missionRuntime";
import { sky } from "@/scene/skyRuntime";
import { transit } from "@/scene/transitRuntime";
import { simNow } from "@/state/simClock";
import { useStore } from "@/state/store";
import { dock, toNextStation, undock } from "./missionActions";
import { StationPanel } from "./StationPanel";

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
  const index = useStore((s) => s.stationIndex);
  const mode = useStore((s) => s.transitMode);
  const [now, setNow] = useState(() => simNow());
  useEffect(() => {
    const id = window.setInterval(() => setNow(simNow()), 250);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section className="panel timeline" aria-label={ui.transit.stations}>
      <p className="panel-kicker">{ui.transit.stations}</p>
      <ol>
        {stations.map((s, i) => {
          const stop = transit.stops[i];
          const status =
            i < index
              ? ui.transit.visited
              : i === index && mode !== "cruise"
                ? ui.transit.here
                : stop
                  ? ui.transit.days((stop.tMs - now) / DAY)
                  : "";
          return (
            <li key={s.id} className={i === index && mode !== "cruise" ? "current" : i < index ? "done" : ""}>
              <span>{s.name}</span>
              <span className="timeline-status">{status}</span>
            </li>
          );
        })}
      </ol>
      {mode === "cruise" && index < stations.length && (
        <button type="button" className="hud-button" onClick={toNextStation}>
          {ui.transit.next}
        </button>
      )}
    </section>
  );
}

function DockBar() {
  const mode = useStore((s) => s.transitMode);
  const index = useStore((s) => s.stationIndex);
  const station = stations[index];
  const panel = useRef<HTMLElement>(null);

  // Move focus into the station panel when it opens, so keyboard users land on the content.
  useEffect(() => {
    if (mode === "docked") panel.current?.focus();
  }, [mode]);

  if (mode === "arrived") {
    return (
      <p className="panel dock-bar" role="status">
        {ui.transit.arrived}
      </p>
    );
  }
  if (!station || mode === "cruise") return null;
  if (mode === "docked") {
    return (
      <section className="panel station-panel" aria-labelledby="station-heading" tabIndex={-1} ref={panel}>
        <div className="body-head">
          <h2 id="station-heading">{station.name}</h2>
          <button type="button" className="hud-button" onClick={undock}>
            {ui.dock.undock}
          </button>
        </div>
        <StationPanel station={station} />
      </section>
    );
  }
  const text =
    mode === "approach"
      ? ui.dock.approaching(station.name)
      : mode === "holding"
        ? ui.dock.holding(station.name)
        : mode === "docking"
          ? ui.dock.docking
          : "";
  return (
    <div className="panel dock-bar" role="status">
      <p>{text}</p>
      {mode === "holding" && (
        <div className="brief-actions">
          <button type="button" className="hud-button primary" onClick={dock}>
            {ui.dock.dock}
          </button>
          <button type="button" className="hud-button" onClick={undock}>
            {ui.dock.skip}
          </button>
        </div>
      )}
    </div>
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
