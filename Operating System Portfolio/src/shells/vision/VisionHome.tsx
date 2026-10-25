"use client";

import { useEffect, useRef } from "react";
import { AppIcon } from "@/design/AppIcon";
import { launchable } from "@/os/apps/registry";
import { useVision } from "./state";

const ROW = [6, 5];

// Home in folioVision: round app icons floating in staggered rows, like a
// honeycomb, over the room. Picking one opens its panel.
export function VisionHome({ onClose }: { onClose: () => void }) {
  const openApp = useVision((s) => s.openApp);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.querySelector("button")?.focus({ preventScroll: true });
  }, []);

  const rows: (typeof launchable)[] = [];
  for (let i = 0, r = 0; i < launchable.length; r++) {
    const n = ROW[r % 2]!;
    rows.push(launchable.slice(i, i + n));
    i += n;
  }

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label="Apps"
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
        e.stopPropagation();
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="folio-fade-in absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 bg-[rgb(20_20_40/0.18)] backdrop-blur-[6px]"
    >
      {rows.map((row, r) => (
        <div key={r} className="flex gap-7" onClick={(e) => e.target === e.currentTarget && onClose()}>
          {row.map((app) => (
            <button
              key={app.id}
              onClick={() => openApp(app.id)}
              className="group flex w-24 flex-col items-center gap-2 rounded-full outline-offset-4 transition-transform duration-200 hover:-translate-y-1.5 hover:scale-105"
            >
              <span className="rounded-full shadow-[0_18px_40px_-12px_rgb(10_10_30/0.6)] ring-1 ring-white/30 transition-shadow group-hover:ring-2 group-hover:ring-white/70">
                <AppIcon id={app.id} icon={app.icon} size={80} round />
              </span>
              <span className="text-[13px] font-medium text-white [text-shadow:0_1px_3px_rgb(0_0_0/0.45)]">{app.name}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
