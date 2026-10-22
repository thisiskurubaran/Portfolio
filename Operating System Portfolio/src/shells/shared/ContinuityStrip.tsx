"use client";

import type { Shell } from "@/os/device/resolve";
import { availableShells } from "@/os/device/shells";
import { useDevice } from "@/os/device/useDevice";
import { useHandoff } from "@/os/system/handoff";

// Small outlines so each device reads at a glance.
function Silhouette({ shell }: { shell: Shell }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinejoin: "round" as const };
  return (
    <svg aria-hidden width="34" height="28" viewBox="0 0 34 28">
      {shell === "phone" && <rect x="12" y="2" width="10" height="24" rx="2.5" {...common} />}
      {shell === "pad" && <rect x="7" y="2" width="20" height="24" rx="2.5" {...common} />}
      {shell === "desk" && (
        <>
          <rect x="3" y="3" width="28" height="17" rx="2" {...common} />
          <path d="M12 25h10M17 20v5" {...common} />
        </>
      )}
      {shell === "vision" && (
        <>
          <rect x="2" y="8" width="13" height="12" rx="3" {...common} />
          <rect x="19" y="8" width="13" height="12" rx="3" {...common} />
          <path d="M15 13h4" {...common} />
        </>
      )}
    </svg>
  );
}

// F02: the continuity strip. Picking a device relaunches the same portfolio
// as that shell, with the handoff animation.
export function ContinuityStrip({ compact = false }: { compact?: boolean }) {
  const { shell, override, setOverride } = useDevice();
  const start = useHandoff((s) => s.start);
  return (
    <div>
      <div role="group" aria-label="Open as another device" className={`grid gap-2 ${compact ? "grid-cols-4" : "grid-cols-2 sm:grid-cols-4"}`}>
        {availableShells.map((s) => (
          <button
            key={s.id}
            onClick={() => s.id !== shell && start(s.id)}
            aria-pressed={shell === s.id}
            className={`flex flex-col items-center gap-1 rounded-2xl bg-glass p-3 text-xs ${shell === s.id ? "ring-2 ring-accent" : "hover:bg-glass-strong"}`}
          >
            <Silhouette shell={s.id} />
            <span className="font-medium">{s.name}</span>
            {!compact && <span className="opacity-60">{s.device}</span>}
          </button>
        ))}
      </div>
      {override && (
        <button onClick={() => setOverride(null)} className="mt-2 text-xs text-accent-fg underline">
          Pick automatically for this device
        </button>
      )}
    </div>
  );
}
