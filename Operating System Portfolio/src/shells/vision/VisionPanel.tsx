"use client";

import { Suspense, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { AppIcon } from "@/design/AppIcon";
import { Icon } from "@/design/icons";
import { Skeleton } from "@/os/apps/ui";
import { appComponents, getApp, type AppId } from "@/os/apps/registry";
import { useVision } from "./state";

const ARC_RADIUS = 1100;
const STEP = 0.5;
const FOCUS_PULL = 220;
const NUDGE = 24;
const PERSPECTIVE = 1400;

// Keep the title and the move bar on screen.
const clampY = (y: number) => Math.max(-window.innerHeight * 0.25, Math.min(window.innerHeight * 0.2, y));

// One floating window on an arc around the viewer, placed with CSS 3D so it
// stays real, selectable, accessible DOM. The arc turns so the focused panel
// sits in front, eased forward; the rest wait to either side. The bar under a
// panel moves it, with a pointer or the arrow keys.
export function VisionPanel({ id, index, center }: { id: AppId; index: number; center: number }) {
  const focused = useVision((s) => s.focused === id);
  const offset = useVision((s) => s.offsets[id]) ?? { x: 0, y: 0 };
  const { focus, close, move } = useVision.getState();
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const glass = useRef<HTMLElement>(null);
  const app = getApp(id);
  const Content = appComponents[id];
  if (!app) return null;

  const angle = (index - center) * STEP;
  const x = ARC_RADIUS * Math.sin(angle) + offset.x;
  const z = ARC_RADIUS * Math.cos(angle) - ARC_RADIUS + (focused ? FOCUS_PULL : -60);

  const grab = (e: PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
    setDragging(true);
    focus(id);
  };
  const pull = (e: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    // A panel nearer the viewer looks bigger, so scale the pointer travel back
    // down to keep the panel under the finger.
    const k = (PERSPECTIVE - z) / PERSPECTIVE;
    if (d) move(id, d.ox + (e.clientX - d.x) * k, clampY(d.oy + (e.clientY - d.y) * k));
  };
  const release = () => {
    drag.current = null;
    setDragging(false);
  };
  const nudge = (e: KeyboardEvent<HTMLButtonElement>) => {
    const step = { ArrowLeft: [-NUDGE, 0], ArrowRight: [NUDGE, 0], ArrowUp: [0, -NUDGE], ArrowDown: [0, NUDGE] }[e.key];
    if (!step) return;
    // The shell uses bare arrows to switch panels; here they move this one.
    e.preventDefault();
    e.stopPropagation();
    move(id, offset.x + step[0]!, clampY(offset.y + step[1]!));
  };
  // A soft light follows the pointer across the glass.
  const shine = (e: PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    glass.current?.style.setProperty("--mx", `${e.clientX - r.left}px`);
    glass.current?.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <div
      className={`folio-vision-panel absolute left-1/2 top-[45%] ${dragging ? "!transition-none" : ""}`}
      style={{ transform: `translate(-50%, -50%) translate3d(${x}px, ${offset.y}px, ${z}px) rotateY(${-angle}rad)`, zIndex: focused ? 10 : 5 - Math.abs(index - center) }}
    >
      <div className={`folio-vision-lift ${focused ? "" : "folio-vision-liftable"}`}>
        <p className="mb-2.5 flex items-center justify-center">
          <span className="flex items-center gap-2 rounded-full bg-[rgb(40_40_48/0.45)] py-1 pl-1 pr-3 text-[13px] font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.2)] backdrop-blur-2xl">
            <AppIcon id={app.id} icon={app.icon} size={22} round />
            {app.name}
          </span>
        </p>
        <section
          ref={glass}
          aria-label={app.name}
          aria-current={focused || undefined}
          onPointerDown={() => !focused && focus(id)}
          onPointerMove={shine}
          onFocus={() => !focused && focus(id)}
          className={`folio-vision-glass relative flex h-[min(430px,52vh)] w-[min(580px,42vw)] flex-col overflow-hidden rounded-[34px] text-[#f7f7f9] transition-[opacity,box-shadow] duration-300 ${
            focused ? "opacity-100 shadow-[0_50px_120px_-24px_rgb(10_10_30/0.55)]" : "opacity-80 shadow-[0_30px_80px_-24px_rgb(10_10_30/0.45)]"
          }`}
        >
          <div className="relative min-h-0 flex-1 overflow-auto pt-2">
            <Suspense fallback={<Skeleton />}>{Content && <Content />}</Suspense>
          </div>
        </section>
        <div className="mt-3 flex items-center justify-center gap-2.5">
          <button
            onClick={() => close(id)}
            aria-label={`Close ${app.name}`}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgb(40_40_48/0.45)] text-white backdrop-blur-2xl transition-colors hover:bg-[rgb(40_40_48/0.65)]"
          >
            <Icon name="close" size={13} />
          </button>
          <button
            onPointerDown={grab}
            onPointerMove={pull}
            onPointerUp={release}
            onPointerCancel={release}
            onDoubleClick={() => move(id, 0, 0)}
            onKeyDown={nudge}
            aria-label={`Move ${app.name}. Arrow keys move it, double click puts it back.`}
            className={`flex h-8 w-36 touch-none items-center justify-center rounded-full ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
          >
            <span className={`h-[6px] rounded-full transition-all ${dragging ? "w-32 bg-white" : "w-28 bg-white/70 hover:bg-white/90"}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
