"use client";

import { useEffect, useState } from "react";
import { guide } from "@/content/guide";
import { astro, astroInput, EVA_DV, interact, TETHER_M } from "@/scene/astronaut/astronautRuntime";
import { doInteract } from "@/scene/astronaut/AstroKeys";
import { objective, progress } from "@/scene/astronaut/guideRuntime";
import { useStore } from "@/state/store";

type View = { step: keyof typeof guide.steps; dist: number | null; prompt: string | null; dv: number; tether: number };

function read(): View {
  const o = objective.current;
  return {
    step: o.step,
    dist: o.target && astro.mode !== "aboard" ? o.target.distanceTo(astro.pos) : null,
    prompt: interact.near?.label || (progress.inRover ? guide.climbOut : null),
    dv: astro.evaDv,
    tether: astro.pos.distanceTo(astro.anchor),
  };
}

type Key = { label: string; glyph: string; set: (on: boolean) => void };

/** Hold to move, for touch screens. Keyboard users have the keys. */
function MovePad({ eva }: { eva: boolean }) {
  const keys: Key[] = [
    { label: "Left", glyph: "◀", set: (on) => (astroInput.right = on ? -1 : 0) },
    { label: "Forward", glyph: "▲", set: (on) => (astroInput.forward = on ? 1 : 0) },
    { label: "Back", glyph: "▼", set: (on) => (astroInput.forward = on ? -1 : 0) },
    { label: "Right", glyph: "▶", set: (on) => (astroInput.right = on ? 1 : 0) },
    { label: eva ? "Up" : "Jump", glyph: eva ? "⤒" : "⤴", set: (on) => (astroInput.up = on) },
  ];
  if (eva) keys.push({ label: "Down", glyph: "⤓", set: (on) => (astroInput.down = on) });
  return (
    <div className="drive-pad move-pad" role="group" aria-label="Move">
      {keys.map((k) => (
        <button
          key={k.label}
          type="button"
          className="hud-button drive-key"
          aria-label={k.label}
          tabIndex={-1}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            k.set(true);
          }}
          onPointerUp={() => k.set(false)}
          onPointerCancel={() => k.set(false)}
          onContextMenu={(e) => e.preventDefault()}
        >
          {k.glyph}
        </button>
      ))}
    </div>
  );
}

/**
 * Mission control's voice: the radio call for this step, the objective with
 * its distance, the prompt when something is in reach, and an autopilot
 * that does the step for anyone who would rather not steer.
 */
export function GuideHud() {
  const mode = useStore((s) => s.astroMode);
  const [v, setV] = useState<View | null>(null);
  useEffect(() => {
    const tick = () => setV(read());
    tick();
    const id = window.setInterval(tick, 150);
    return () => window.clearInterval(id);
  }, []);
  if (!v) return null;
  const step = guide.steps[v.step];
  const auto = objective.current.autopilot;
  const controls =
    mode === "walk" ? guide.controls.walk : mode === "eva" ? guide.controls.eva : progress.inRover ? guide.controls.drive : null;
  return (
    <>
      <section className="panel guide" aria-label={guide.objective}>
        {/* Calls change a step at a time, seconds apart: a polite region reads each once. */}
        <p className="guide-say" aria-live="polite">
          <span className="hud-key">{guide.capcom}</span> {step.say}
        </p>
        <p className="guide-do">
          <strong>{step.do}</strong>
          {v.dist !== null && <span className="timeline-status"> {guide.distance(v.dist)}</span>}
        </p>
        {mode === "eva" && (
          <p className="guide-gauges">
            <span className="hud-key">{guide.jetpack}</span> {Math.round((v.dv / EVA_DV) * 100)}%{"  "}
            <span className="hud-key">{guide.tether}</span> {Math.round(v.tether)} / {TETHER_M} m
          </p>
        )}
        {controls && <p className="planner-note">{controls}</p>}
        {auto && (
          <button type="button" className="hud-button small" title={guide.autopilotNote} onClick={auto}>
            {guide.autopilot}: {step.do.toLowerCase()}
          </button>
        )}
      </section>
      {v.prompt && (
        <button type="button" className="hud-button primary interact-prompt" onClick={doInteract}>
          <kbd>{guide.press}</kbd> {v.prompt}
        </button>
      )}
      {mode !== "aboard" && <MovePad eva={mode === "eva"} />}
    </>
  );
}
