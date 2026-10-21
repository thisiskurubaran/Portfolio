"use client";

import { useEffect, useRef } from "react";
import { entries } from "@/content";
import { ui } from "@/content/ui";
import { shipRuntime } from "@/scene/ships/shipRuntime";
import { useSceneStore } from "@/state/store";

// Keeps a focused label on screen even if its ship is outside the view.
const EDGE = 90;

/**
 * Names and tags that fade in over ships the beam has found. Positions are
 * written straight to the DOM each animation frame so React never re-renders.
 *
 * Each label is also the ship's button: a large tap target on phones, and the
 * keyboard route to every ship. Tab moves between them and the beam swings to
 * whichever has focus.
 */
export function ShipLabels() {
  const refs = useRef(new Map<string, HTMLButtonElement>());
  // Rendered, not set per frame, so the labels are focusable again in the same
  // commit that closes the panel and focus can return to the ship.
  const panelOpen = useSceneStore((s) => s.panelOpen);

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const open = useSceneStore.getState().panelOpen;
      const w = window.innerWidth;
      const h = window.innerHeight;
      for (const [id, el] of refs.current) {
        const s = shipRuntime.get(id);
        const focused = el === document.activeElement;
        let reveal = s && s.onScreen && !open ? s.reveal : 0;
        let x = s?.sx ?? 0;
        let y = s?.sy ?? 0;
        if (focused && !open) {
          reveal = 1;
          x = Math.min(w - EDGE, Math.max(EDGE, x));
          y = Math.min(h - EDGE / 2, Math.max(EDGE, y));
        }
        el.style.opacity = reveal.toFixed(3);
        el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
        el.style.pointerEvents = reveal > 0.4 ? "auto" : "none";
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <nav className="ship-labels" aria-label={ui.ships.nav} inert={panelOpen}>
      {entries.map((e) => (
        <button
          key={e.id}
          type="button"
          className="ship-label"
          data-ship={e.id}
          ref={(el) => {
            if (el) refs.current.set(e.id, el);
            else refs.current.delete(e.id);
          }}
          onFocus={() => useSceneStore.getState().focusShip(e.id)}
          onBlur={() => {
            if (useSceneStore.getState().focusedId === e.id) useSceneStore.getState().focusShip(null);
          }}
          onClick={() => useSceneStore.getState().select(e.id)}
        >
          <span className="ship-label-title">{e.title}</span>
          <span className="ship-label-tag">{e.tag}</span>
        </button>
      ))}
    </nav>
  );
}
