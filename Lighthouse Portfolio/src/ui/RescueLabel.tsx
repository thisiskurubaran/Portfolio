"use client";

import { useEffect, useRef } from "react";
import { ui } from "@/content/ui";
import { RESCUE_ID, rescueRuntime } from "@/scene/ships/rescueRuntime";
import { shipRuntime } from "@/scene/ships/shipRuntime";
import { useSceneStore } from "@/state/store";

/**
 * F09 prompt over the boat in distress. It is also a tab stop: focusing it
 * swings the beam onto the boat, so keyboard users can rescue it too.
 */
export function RescueLabel() {
  const phase = useSceneStore((s) => s.rescuePhase);
  const ref = useRef<HTMLButtonElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const active = phase === "distress" || phase === "guiding";

  useEffect(() => {
    if (!active) return;
    let frame = 0;
    const tick = () => {
      const el = ref.current;
      const s = shipRuntime.get(RESCUE_ID);
      if (el && s) {
        const focused = el === document.activeElement;
        const shown = s.onScreen || focused;
        const x = Math.min(window.innerWidth - 90, Math.max(90, s.sx));
        const y = Math.min(window.innerHeight - 40, Math.max(90, s.sy));
        el.style.opacity = shown ? "1" : "0";
        el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
        const p = Math.round(rescueRuntime.progress * 100);
        if (barRef.current) barRef.current.style.width = `${p}%`;
        el.querySelector("[role=progressbar]")?.setAttribute("aria-valuenow", String(p));
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active]);

  if (!active) return null;

  return (
    <button
      ref={ref}
      type="button"
      className="ship-label rescue-label"
      data-ship={RESCUE_ID}
      onFocus={() => useSceneStore.getState().focusShip(RESCUE_ID)}
      onBlur={() => {
        if (useSceneStore.getState().focusedId === RESCUE_ID) useSceneStore.getState().focusShip(null);
      }}
    >
      <span className="ship-label-title">{phase === "guiding" ? ui.rescue.guiding : ui.rescue.distress}</span>
      {phase === "distress" && (
        <>
          <span className="ship-label-tag">{ui.rescue.hint}</span>
          <span
            className="rescue-progress"
            role="progressbar"
            aria-label={ui.rescue.progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={0}
          >
            <span ref={barRef} />
          </span>
        </>
      )}
    </button>
  );
}
