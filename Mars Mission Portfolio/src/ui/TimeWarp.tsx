"use client";

import { ui } from "@/content/ui";
import { useStore } from "@/state/store";

export function TimeWarp() {
  const warp = useStore((s) => s.warp);
  const setWarp = useStore((s) => s.setWarp);
  const resetTime = useStore((s) => s.resetTime);

  return (
    <div className="hud-warp" role="group" aria-label={ui.warp.label}>
      {ui.warp.options.map((o) => (
        <button
          key={o.value}
          type="button"
          className="hud-button"
          aria-pressed={warp === o.value}
          title={o.description}
          onClick={() => setWarp(o.value)}
        >
          {o.label}
        </button>
      ))}
      <button type="button" className="hud-button" title={ui.warp.resetDescription} onClick={resetTime}>
        {ui.warp.reset}
      </button>
    </div>
  );
}
