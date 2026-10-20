"use client";

import { useEffect, useRef } from "react";
import { entries } from "@/content";
import { shipRuntime } from "@/scene/ships/shipRuntime";
import { useSceneStore } from "@/state/store";

/**
 * Names and tags that fade in over ships the beam has found. Positions are
 * written straight to the DOM each animation frame so React never re-renders.
 * The label doubles as a large tap target, since small ships are hard to hit
 * on a phone.
 */
export function ShipLabels() {
  const refs = useRef(new Map<string, HTMLButtonElement>());

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      for (const [id, el] of refs.current) {
        const s = shipRuntime.get(id);
        const reveal = s && s.onScreen ? s.reveal : 0;
        const shown = reveal > 0.4;
        el.style.opacity = reveal.toFixed(3);
        el.style.transform = `translate(${s?.sx ?? 0}px, ${s?.sy ?? 0}px) translate(-50%, -100%)`;
        el.style.pointerEvents = shown ? "auto" : "none";
        el.toggleAttribute("aria-hidden", !shown);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="ship-labels">
      {entries.map((e) => (
        <button
          key={e.id}
          type="button"
          // Keyboard reaches ships through the scene's own Tab cycling instead.
          tabIndex={-1}
          aria-hidden
          className="ship-label"
          ref={(el) => {
            if (el) refs.current.set(e.id, el);
            else refs.current.delete(e.id);
          }}
          onClick={() => useSceneStore.getState().select(e.id)}
        >
          <span className="ship-label-title">{e.title}</span>
          <span className="ship-label-tag">{e.tag}</span>
        </button>
      ))}
    </div>
  );
}
