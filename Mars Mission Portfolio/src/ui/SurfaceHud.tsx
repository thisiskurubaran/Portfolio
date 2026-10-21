"use client";

import { useEffect, useRef, useState } from "react";
import { contactLinks } from "@/content/contact";
import { debris } from "@/content/debris";
import { experience } from "@/content/experience";
import { base, deepDives } from "@/content/surface";
import { ui } from "@/content/ui";
import { driveInput, FLIPPED_DEG, roverState, TILT_WARN_DEG } from "@/scene/surface/roverState";
import { EDL, edlAltitudeKm, edlSpeedKmS, edlStep, type EdlStep, surface } from "@/scene/surfaceRuntime";
import { useStore } from "@/state/store";
import { rightRover } from "./missionActions";
import { RoleCard } from "./StationPanel";

function useTick(ms: number): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setN((v) => v + 1), ms);
    return () => window.clearInterval(id);
  }, [ms]);
  return n;
}

function formatAlt(km: number): string {
  return km >= 1 ? `${km.toFixed(1)} km` : `${Math.round(km * 1000)} m`;
}

function formatVel(kmS: number): string {
  return kmS >= 1 ? `${kmS.toFixed(2)} km/s` : `${Math.round(kmS * 1000)} m/s`;
}

function useSinceDescent(): number {
  const [since, setSince] = useState(0);
  useEffect(() => {
    const tick = () => setSince((Date.now() - surface.startedAt) / 1000);
    tick();
    const id = window.setInterval(tick, 100);
    return () => window.clearInterval(id);
  }, []);
  return since;
}

export function DescentHud() {
  const since = useSinceDescent();
  const step: EdlStep = edlStep(Math.min(since, EDL.touchdown));
  const rows: [string, string][] = [
    [ui.descent.alt, formatAlt(edlAltitudeKm(since))],
    [ui.descent.vel, formatVel(edlSpeedKmS(since))],
  ];
  return (
    <>
      <section className="panel telemetry orbit-telemetry" aria-label={ui.descent.label}>
        {rows.map(([k, v]) => (
          <div key={k}>
            <span className="hud-key">{k}</span>
            <span className="hud-value">{v}</span>
          </div>
        ))}
      </section>
      <div className="panel dock-bar" role="status" aria-live="polite">
        <p>
          <strong>{ui.descent.steps[step]}.</strong> {ui.descent.notes[step]}
        </p>
        <p className="planner-note">{ui.descent.note}</p>
      </div>
    </>
  );
}

function compass(deg: number): string {
  const points = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return points[Math.round(deg / 45) % 8]!;
}

function placeName(id: string): string {
  if (id === "base") return base.name;
  if (id.startsWith("wreck:")) return debris.find((d) => `wreck:${d.id}` === id)?.name ?? id;
  return deepDives.find((d) => d.id === id)?.name ?? id;
}

function RoverTelemetry() {
  useTick(150);
  const tilt = roverState.tiltDeg;
  const near = roverState.nearest;
  const rows: [string, string][] = [
    [ui.surface.speed, `${Math.abs(roverState.speed * 3.6).toFixed(1)} km/h`],
    [ui.surface.heading, `${Math.round(roverState.headingDeg)}° ${compass(roverState.headingDeg)}`],
    [ui.surface.tilt, `${Math.round(tilt)}°`],
  ];
  return (
    <section className="panel telemetry orbit-telemetry rover-telemetry" aria-label={ui.surface.label}>
      {rows.map(([k, v]) => (
        <div key={k}>
          <span className="hud-key">{k}</span>
          <span className="hud-value">{v}</span>
        </div>
      ))}
      {near && (
        <div>
          <span className="hud-key">{ui.surface.nearest}</span>
          <span className="hud-value">
            {placeName(near.id)}, {ui.surface.m(near.d)}
          </span>
        </div>
      )}
      {tilt >= FLIPPED_DEG ? (
        <>
          <p className="telemetry-note warn">{ui.surface.flipped}</p>
          <button type="button" className="hud-button small" onClick={rightRover}>
            {ui.surface.rightUp}
          </button>
        </>
      ) : (
        tilt >= TILT_WARN_DEG && <p className="telemetry-note warn">{ui.surface.tiltWarn}</p>
      )}
    </section>
  );
}

type Control = { label: string; glyph: string; set: (on: boolean) => void };

const controls: Control[] = [
  { label: ui.surface.left, glyph: "◀", set: (on) => (driveInput.steer = on ? 1 : 0) },
  { label: ui.surface.forward, glyph: "▲", set: (on) => (driveInput.throttle = on ? 1 : 0) },
  { label: ui.surface.reverse, glyph: "▼", set: (on) => (driveInput.throttle = on ? -1 : 0) },
  { label: ui.surface.right, glyph: "▶", set: (on) => (driveInput.steer = on ? -1 : 0) },
  { label: ui.surface.brake, glyph: "■", set: (on) => (driveInput.brake = on) },
];

/** Hold to drive, for touch screens and pointer users. Keyboard drivers use the keys. */
function DrivePad() {
  return (
    <div className="drive-pad" role="group" aria-label={ui.surface.pad}>
      {controls.map((c) => (
        <button
          key={c.label}
          type="button"
          className="hud-button drive-key"
          aria-label={c.label}
          // Keyboard users drive with the keys; these buttons only answer to pointers.
          tabIndex={-1}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            c.set(true);
          }}
          onPointerUp={() => c.set(false)}
          onPointerCancel={() => c.set(false)}
          onContextMenu={(e) => e.preventDefault()}
        >
          {c.glyph}
        </button>
      ))}
    </div>
  );
}

function DeepDivePanel({ id }: { id: string }) {
  const dive = deepDives.find((d) => d.id === id);
  if (!dive) return null;
  const roles = experience.filter((r) => r.skills.some((s) => dive.skills.includes(s)));
  return (
    <>
      <h2>{dive.name}</h2>
      <p className="planner-note">{ui.surface.deepDiveIntro}</p>
      <ul className="chips" aria-label="Skills">
        {dive.skills.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
      <div className="station-body">
        {roles.map((r) => (
          <RoleCard key={`${r.company}${r.title}${r.start}`} role={r} />
        ))}
      </div>
    </>
  );
}

function BasePanel() {
  return (
    <>
      <h2>{base.name}</h2>
      <p className="planner-note">{ui.surface.baseIntro}</p>
      <ul className="comms-list">
        {contactLinks.map((l) => (
          <li key={l.label}>
            <a href={l.url} target="_blank" rel="noopener noreferrer">
              {l.label}
            </a>{" "}
            <span className="timeline-status">{l.handle}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

function WreckPanel({ id }: { id: string }) {
  const d = debris.find((w) => `wreck:${w.id}` === id);
  if (!d) return null;
  return (
    <>
      <h2>{d.name}</h2>
      {d.years && <p className="role-meta">{d.years}</p>}
      <p>{d.summary}</p>
      <h3>{ui.surface.wreckWrong}</h3>
      <p>{d.wentWrong}</p>
      <h3>{ui.surface.wreckLearned}</h3>
      <p>{d.learned}</p>
    </>
  );
}

function PlacePanel({ id, onClose }: { id: string; onClose: () => void }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, [id]);
  return (
    <section ref={ref} className="panel station-panel" tabIndex={-1} aria-label={placeName(id)}>
      <button type="button" className="hud-button small panel-close" onClick={onClose}>
        {ui.surface.close}
      </button>
      {id === "base" ? <BasePanel /> : id.startsWith("wreck:") ? <WreckPanel id={id} /> : <DeepDivePanel id={id} />}
    </section>
  );
}

export function SurfaceHud() {
  const target = useStore((s) => s.surfaceTarget);
  const [open, setOpen] = useState<string | null>(null);
  // Leaving range closes the panel, so driving on is all it takes to move along.
  const shown = open && open === target ? open : null;
  return (
    <>
      <RoverTelemetry />
      <div className="panel dock-bar">
        {target && !shown ? (
          <div className="brief-actions">
            <button type="button" className="hud-button" onClick={() => setOpen(target)}>
              {ui.surface.open}: {placeName(target)}
            </button>
          </div>
        ) : (
          <p className="planner-note">{shown ? ui.surface.keys : `${ui.surface.keys} ${ui.surface.driveTo}`}</p>
        )}
      </div>
      <DrivePad />
      {shown && <PlacePanel id={shown} onClose={() => setOpen(null)} />}
    </>
  );
}
