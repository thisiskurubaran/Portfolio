"use client";

import type { SnapKind } from "./snap";

// Each layout is a row of zones as [left%, top%, width%, height%].
const layouts: { label: string; zones: [SnapKind, number, number, number, number][] }[] = [
  { label: "Halves", zones: [["left", 0, 0, 50, 100], ["right", 50, 0, 50, 100]] },
  { label: "Thirds", zones: [["left-third", 0, 0, 33.3, 100], ["center-third", 33.3, 0, 33.4, 100], ["right-third", 66.7, 0, 33.3, 100]] },
  { label: "Two thirds", zones: [["left-two-thirds", 0, 0, 66.7, 100], ["right-third", 66.7, 0, 33.3, 100]] },
  {
    label: "Quarters",
    zones: [["top-left", 0, 0, 50, 50], ["top-right", 50, 0, 50, 50], ["bottom-left", 0, 50, 50, 50], ["bottom-right", 50, 50, 50, 50]],
  },
  { label: "Fill", zones: [["fill", 0, 0, 100, 100]] },
];

// F18: snap layouts. Hover the maximise button, pick a zone.
export function SnapPicker({ onPick }: { onPick: (kind: SnapKind) => void }) {
  return (
    <div role="menu" aria-label="Snap layouts" className="grid w-max grid-cols-3 gap-2 rounded-xl border border-line bg-surface/95 p-2.5 shadow-3 backdrop-blur-2xl">
      {layouts.map((l) => (
        <div key={l.label} className="relative h-11 w-[72px] rounded-md bg-glass ring-1 ring-line" aria-label={l.label} role="group">
          {l.zones.map(([kind, x, y, w, h]) => (
            <button
              key={kind}
              role="menuitem"
              aria-label={`${l.label}: ${kind.replace(/-/g, " ")}`}
              onClick={() => onPick(kind)}
              className="absolute rounded-[4px] bg-glass-strong transition-colors hover:bg-accent focus-visible:bg-accent"
              style={{ left: `calc(${x}% + 2px)`, top: `calc(${y}% + 2px)`, width: `calc(${w}% - 4px)`, height: `calc(${h}% - 4px)` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
