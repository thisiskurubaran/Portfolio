"use client";

import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import { PadPane } from "./PadPane";
import { usePad } from "./state";

// Dragging the divider past either end closes that side, as on a real tablet.
const CLOSE_AT = 0.18;

export function SplitView() {
  const { primary, secondary, ratio, setRatio, close } = usePad();
  const box = useRef<HTMLDivElement>(null);
  const divider = useRef<HTMLDivElement>(null);

  const drag = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = box.current;
    if (!el) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = el.getBoundingClientRect();
    let raw = ratio;
    const move = (ev: PointerEvent) => {
      raw = (ev.clientX - rect.left) / rect.width;
      el.style.gridTemplateColumns = `${Math.min(0.92, Math.max(0.08, raw))}fr 14px ${1 - Math.min(0.92, Math.max(0.08, raw))}fr`;
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      el.style.gridTemplateColumns = "";
      if (raw > 1 - CLOSE_AT) close("secondary");
      else if (raw < CLOSE_AT) close("primary");
      else setRatio(raw);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const nudge = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") setRatio(ratio - 0.05);
    else if (e.key === "ArrowRight") setRatio(ratio + 0.05);
  };

  if (!primary) return null;
  if (!secondary) {
    return (
      <div className="h-full p-2">
        <PadPane id={primary} pane="primary" />
      </div>
    );
  }
  return (
    <div ref={box} className="grid h-full p-2" style={{ gridTemplateColumns: `${ratio}fr 14px ${1 - ratio}fr` }}>
      <PadPane id={primary} pane="primary" />
      <div
        ref={divider}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize split view"
        aria-valuenow={Math.round(ratio * 100)}
        aria-valuemin={25}
        aria-valuemax={75}
        tabIndex={0}
        onPointerDown={drag}
        onKeyDown={nudge}
        className="group flex cursor-col-resize touch-none items-center justify-center"
      >
        <span aria-hidden className="h-16 w-1.5 rounded-full bg-paper/40 transition-colors group-hover:bg-accent group-focus-visible:bg-accent group-active:bg-accent" />
      </div>
      <PadPane id={secondary} pane="secondary" />
    </div>
  );
}
