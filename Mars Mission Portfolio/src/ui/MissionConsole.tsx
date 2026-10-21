"use client";

import { useState } from "react";
import { stops } from "@/content/stops";
import { ui } from "@/content/ui";
import { forceStop, transit } from "@/scene/transitRuntime";
import { type ConsoleMode, useConditions } from "@/state/conditions";
import { useStore } from "@/state/store";

const MODES: ConsoleMode[] = ["live", "clear", "solarStorm", "meteors", "dustStorm"];

/**
 * F18: the visitor picks the conditions. Everything here is local to this
 * visitor and resets on reload. It also takes over the old "visit anyway"
 * override: stops the real geometry leaves off the path can be forced into
 * a flyby from here.
 */
export function MissionConsole() {
  const [open, setOpen] = useState(false);
  const mode = useConditions((s) => s.mode);
  const dramatic = useConditions((s) => s.dramatic);
  const setMode = useConditions((s) => s.setMode);
  const setDramatic = useConditions((s) => s.setDramatic);
  const phase = useStore((s) => s.phase);
  const [, setRevision] = useState(0);

  const offPath =
    phase === "transit"
      ? stops.filter((s) => {
          const st = transit.stopStatus[s.id];
          return st && !st.available && !st.forced && st.tMs !== null;
        })
      : [];

  return (
    <div className="console">
      <button type="button" className="hud-button" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {open ? ui.console.close : ui.console.open}
      </button>
      {open && (
        <section className="panel console-panel" aria-label={ui.console.label}>
          <fieldset>
            <legend className="panel-kicker">{ui.console.conditions}</legend>
            {MODES.map((m) => (
              <label key={m} className="console-option">
                <input type="radio" name="console-mode" checked={mode === m} onChange={() => setMode(m)} />
                <span>
                  <strong>{ui.console.modes[m].name}</strong>
                  <span className="planner-note"> {ui.console.modes[m].note}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <label className="console-option">
            <input type="checkbox" checked={dramatic} onChange={(e) => setDramatic(e.target.checked)} />
            <span>
              <strong>{ui.console.dramatic}</strong>
              <span className="planner-note"> {ui.console.dramaticNote}</span>
            </span>
          </label>
          {offPath.length > 0 && (
            <>
              <p className="panel-kicker">{ui.console.flybys}</p>
              <p className="planner-note">{ui.transit.overrideNote}</p>
              {offPath.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="hud-button small"
                  onClick={() => {
                    forceStop(s.id);
                    setRevision((r) => r + 1);
                  }}
                >
                  {ui.console.force(s.name)}
                </button>
              ))}
            </>
          )}
          <p className="planner-note">{ui.console.resets}</p>
        </section>
      )}
    </div>
  );
}
