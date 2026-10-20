"use client";

import { useEffect, useRef } from "react";
import { shipRuntime } from "@/scene/ships/shipRuntime";
import { useSceneStore } from "@/state/store";

type Props = {
  id: string;
  title: string;
  tag: string;
  /** Whether the thing can be found right now (low tide, after midnight...). */
  active: boolean;
};

/**
 * Label and tab stop for something hidden in the scene. Fades in as its
 * reveal rises; focusing it swings the beam over, and it opens like a ship.
 */
export function FindLabel({ id, title, tag, active }: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  const panelOpen = useSceneStore((s) => s.panelOpen);

  useEffect(() => {
    if (!active) return;
    let frame = 0;
    const tick = () => {
      const el = ref.current;
      const s = shipRuntime.get(id);
      if (el && s) {
        const focused = el === document.activeElement;
        // Steps aside while a panel is open, like the ship labels.
        const open = useSceneStore.getState().panelOpen;
        const reveal = open ? 0 : focused ? 1 : s.onScreen ? s.reveal : 0;
        const x = focused ? Math.min(window.innerWidth - 90, Math.max(90, s.sx)) : s.sx;
        const y = focused ? Math.min(window.innerHeight - 40, Math.max(90, s.sy)) : s.sy;
        el.style.opacity = reveal.toFixed(3);
        el.style.pointerEvents = reveal > 0.4 ? "auto" : "none";
        el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, id]);

  if (!active) return null;

  return (
    <button
      ref={ref}
      type="button"
      className="ship-label"
      data-ship={id}
      inert={panelOpen}
      onFocus={() => useSceneStore.getState().focusShip(id)}
      onBlur={() => {
        if (useSceneStore.getState().focusedId === id) useSceneStore.getState().focusShip(null);
      }}
      onClick={() => useSceneStore.getState().select(id)}
    >
      <span className="ship-label-title">{title}</span>
      <span className="ship-label-tag">{tag}</span>
    </button>
  );
}
