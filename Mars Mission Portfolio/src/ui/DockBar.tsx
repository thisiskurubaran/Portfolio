"use client";

import { useEffect, useRef } from "react";
import { ui } from "@/content/ui";
import { visitLabel } from "@/scene/transitRuntime";
import { currentVisits } from "@/scene/visits";
import { useStore } from "@/state/store";
import { beginMarsApproach, dock, undock } from "./missionActions";
import { StationPanel } from "./StationPanel";

/** Docking status and the panel that opens at a station or stop, for every part of the flight. */
export function DockBar() {
  const mode = useStore((s) => s.transitMode);
  const index = useStore((s) => s.visitIndex);
  const visit = currentVisits()[index];
  const panel = useRef<HTMLElement>(null);

  // Move focus into the panel when it opens, so keyboard users land on the content.
  useEffect(() => {
    if (mode === "docked") panel.current?.focus();
  }, [mode]);

  if (mode === "arrived") {
    return (
      <div className="panel dock-bar" role="status">
        <p>{ui.transit.arrived}</p>
        <button type="button" className="hud-button primary" onClick={beginMarsApproach}>
          {ui.mars.begin}
        </button>
      </div>
    );
  }
  if (!visit || mode === "cruise") return null;
  const { name, action } = visitLabel(visit);
  if (mode === "docked") {
    return (
      <section className="panel station-panel" aria-labelledby="station-heading" tabIndex={-1} ref={panel}>
        <div className="body-head">
          <h2 id="station-heading">{name}</h2>
          <button type="button" className="hud-button" onClick={undock}>
            {ui.dock.undock}
          </button>
        </div>
        <StationPanel visit={visit} />
      </section>
    );
  }
  const text =
    mode === "approach"
      ? ui.dock.approaching(name)
      : mode === "holding"
        ? ui.dock.holding(name)
        : mode === "docking"
          ? ui.dock.docking
          : "";
  return (
    <div className="panel dock-bar" role="status">
      <p>{text}</p>
      {mode === "holding" && (
        <div className="brief-actions">
          <button type="button" className="hud-button primary" onClick={dock}>
            {action ?? ui.dock.dock}
          </button>
          <button type="button" className="hud-button" onClick={undock}>
            {ui.dock.skip}
          </button>
        </div>
      )}
    </div>
  );
}
