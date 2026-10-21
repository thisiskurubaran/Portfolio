"use client";

import { useEffect, useState } from "react";
import { landingSites } from "@/content/landingSites";
import { ui } from "@/content/ui";
import { deltaV } from "@/physics/rocketEquation";
import { SHIP } from "@/physics/ship";
import {
  AEROCAPTURE_ALTITUDE_KM,
  canAfford,
  captureStep,
  type CaptureStep,
  deorbitDv,
  hohmannToMoon,
  mars,
} from "@/scene/marsRuntime";
import { transit } from "@/scene/transitRuntime";
import { MARS_MOONS, MARS_RADIUS_KM } from "@/space/mars";
import { simNow } from "@/state/simClock";
import { useStore } from "@/state/store";
import { DockBar } from "./DockBar";
import { chooseLandingSite, transferTo } from "./missionActions";

type Reading = { alt: string; vel: string; fuel: string; dv: string; step: CaptureStep };

function read(): Reading {
  const prop = transit.propellantKg;
  return {
    alt: `${Math.round(mars.shipKm.length() - MARS_RADIUS_KM).toLocaleString("en")} km`,
    vel: `${mars.shipVelKmS.length().toFixed(2)} km/s`,
    fuel: `${Math.round((prop / (SHIP.wetKg - SHIP.dryKg)) * 100)}% (${(prop / 1000).toFixed(1)} t)`,
    dv: `${deltaV(SHIP.dryKg + prop, SHIP.dryKg, SHIP.ispS).toFixed(2)} km/s`,
    step: captureStep(simNow()),
  };
}

function useReading(): Reading | null {
  const [r, setR] = useState<Reading | null>(null);
  useEffect(() => {
    const tick = () => setR(read());
    tick();
    const id = window.setInterval(tick, 200);
    return () => window.clearInterval(id);
  }, []);
  return r;
}

function Telemetry({ r }: { r: Reading | null }) {
  const rows: [string, string | undefined][] = [
    [ui.mars.alt, r?.alt],
    ["VEL", r?.vel],
    [ui.transit.fuel, r?.fuel],
    [ui.mars.dvLeft, r?.dv],
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

/** Approach, drag pass, coast and insertion burn, with what each one does. */
export function CaptureHud() {
  const r = useReading();
  const step = r?.step ?? "approach";
  const vInf = mars.hyperbola?.vInf ?? 0;
  const note =
    step === "approach"
      ? ui.mars.approachNote(vInf, AEROCAPTURE_ALTITUDE_KM)
      : step === "aerocapture"
        ? ui.mars.aeroNote(mars.aerocaptureDv)
        : step === "coast"
          ? ui.mars.coastNote
          : ui.mars.burnNote(mars.insertionDv);
  return (
    <>
      <Telemetry r={r} />
      {/* Step changes come every few seconds at most, so a polite live region is fine. */}
      <div className="panel dock-bar" role="status" aria-live="polite">
        <p>
          <strong>{step === "done" ? "" : ui.mars.steps[step]}.</strong> {note}
        </p>
      </div>
    </>
  );
}

function Moons() {
  const mode = useStore((s) => s.transitMode);
  const site = useStore((s) => s.landingSite);
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 500);
    return () => window.clearInterval(id);
  }, []);

  const other = mars.parked === "phobos" ? "deimos" : "phobos";
  const h = hohmannToMoon(other);
  const transferOk = canAfford(h.dv1 + h.dv2);
  const deorbit = deorbitDv();
  const deorbitOk = canAfford(deorbit);
  const idle = mode === "cruise";

  return (
    <section className="panel timeline" aria-label={ui.mars.moons}>
      <p className="panel-kicker">{ui.mars.moons}</p>
      {mode === "transfer" && mars.transfer && <p>{ui.mars.transferring(MARS_MOONS[mars.transfer.to].name)}</p>}
      {idle && (
        <>
          <p className="planner-note">{ui.mars.transferNote(h.dv1 + h.dv2, h.hours)}</p>
          <button type="button" className="hud-button" disabled={!transferOk} onClick={() => transferTo(other)}>
            {other === "deimos" ? ui.mars.deimosGo : ui.mars.phobosGo}
          </button>
          {!transferOk && <p className="planner-note">{ui.mars.cannotAfford}</p>}

          <p className="panel-kicker sites-heading">{ui.mars.sites}</p>
          <p className="planner-note">{ui.mars.sitesNote(deorbit)}</p>
          {!deorbitOk && <p className="planner-note">{ui.mars.cannotAfford}</p>}
          <ul className="site-list">
            {landingSites.map((s) => (
              <li key={s.id}>
                <div>
                  <strong>{s.name}</strong>
                  <span className="timeline-status">
                    {" "}
                    {Math.abs(s.latDeg).toFixed(1)}°{s.latDeg >= 0 ? "N" : "S"} {Math.abs(s.lonDeg).toFixed(1)}°
                    {s.lonDeg >= 0 ? "E" : "W"}
                  </span>
                  <p className="planner-note">
                    {s.note}
                    {s.elevationKm !== undefined && ` ${ui.mars.elevation(-s.elevationKm)}.`}
                  </p>
                </div>
                <button
                  type="button"
                  className="hud-button small"
                  aria-pressed={site?.id === s.id}
                  disabled={!deorbitOk}
                  onClick={() => chooseLandingSite(s)}
                >
                  {site?.id === s.id ? ui.mars.selected : ui.mars.select}
                </button>
              </li>
            ))}
          </ul>
          {site && <p className="planner-note">{ui.mars.siteLocked(site.name)}</p>}
        </>
      )}
    </section>
  );
}

export function MarsOrbitHud() {
  const r = useReading();
  return (
    <>
      <Telemetry r={r} />
      <Moons />
      <DockBar />
    </>
  );
}
