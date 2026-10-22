"use client";

import { Suspense } from "react";
import { AppIcon } from "@/design/AppIcon";
import { Skeleton } from "@/os/apps/ui";
import { appComponents, getApp, type AppId } from "@/os/apps/registry";
import { useVision } from "./state";

const ARC_RADIUS = 1100;
const STEP = 0.5;
const FOCUS_PULL = 220;

// One floating window on an arc around the viewer, placed with CSS 3D so it
// stays real, selectable, accessible DOM. The arc turns so the focused panel
// sits in front, eased forward; the rest wait to either side.
export function VisionPanel({ id, index, center }: { id: AppId; index: number; center: number }) {
  const focused = useVision((s) => s.focused === id);
  const focus = useVision((s) => s.focus);
  const close = useVision((s) => s.close);
  const app = getApp(id);
  const Content = appComponents[id];
  if (!app) return null;

  const angle = (index - center) * STEP;
  const x = ARC_RADIUS * Math.sin(angle);
  const z = ARC_RADIUS * Math.cos(angle) - ARC_RADIUS + (focused ? FOCUS_PULL : -60);

  return (
    <div
      className="folio-vision-panel absolute left-1/2 top-1/2"
      style={{ transform: `translate(-50%, -50%) translate3d(${x}px, 0, ${z}px) rotateY(${-angle}rad)`, zIndex: focused ? 10 : 5 - Math.abs(index - center) }}
    >
      <section
        aria-label={app.name}
        aria-current={focused || undefined}
        onPointerDown={() => !focused && focus(id)}
        onFocus={() => !focused && focus(id)}
        className={`flex h-[min(420px,52vh)] w-[min(560px,40vw)] flex-col overflow-hidden rounded-[28px] border border-white/25 bg-[rgb(30_38_50/0.55)] text-[#f6f4ef] shadow-[0_30px_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-opacity duration-300 ${
          focused ? "opacity-100" : "opacity-60 hover:opacity-80"
        }`}
      >
        <header className="flex h-11 shrink-0 items-center justify-center gap-2 border-b border-white/15 text-sm font-medium">
          <AppIcon id={app.id} icon={app.icon} size={22} />
          {app.name}
        </header>
        <div className="min-h-0 flex-1 overflow-auto">
          <Suspense fallback={<Skeleton />}>{Content && <Content />}</Suspense>
        </div>
      </section>
      <div className="mt-3 flex items-center justify-center gap-3">
        <button onClick={() => close(id)} aria-label={`Close ${app.name}`} className="h-7 w-7 rounded-full bg-white/15 text-sm text-white backdrop-blur-xl hover:bg-white/25">
          ×
        </button>
        <span aria-hidden className="h-1.5 w-24 rounded-full bg-white/40" />
      </div>
    </div>
  );
}
