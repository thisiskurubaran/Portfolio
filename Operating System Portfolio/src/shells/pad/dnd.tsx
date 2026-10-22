"use client";

import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import { AppIcon } from "@/design/AppIcon";
import type { IconName } from "@/design/icons";
import { getApp, pinned, type AppDefinition, type AppId } from "@/os/apps/registry";
import { haptic } from "@/os/system/haptics";
import { usePad, type DropZone } from "./state";

const DRAG_START = 8;

// Where a drop lands: the far right edge is slide-over, the right half is
// split view (when an app is already open), anywhere else opens full screen.
function zoneAt(x: number): DropZone {
  const w = window.innerWidth;
  if (x > w * 0.88) return "slide";
  if (x > w * 0.5 && usePad.getState().primary) return "split";
  return "open";
}

function drop(id: AppId, zone: DropZone) {
  const pad = usePad.getState();
  if (zone === "slide") pad.openIn("slide", id);
  else if (zone === "split") pad.openIn("secondary", id);
  else pad.open(id);
  pad.setDockPeek(false);
}

// F34: an app icon that opens on tap and can be dragged to a screen edge.
export function DragTile({ id, icon, label, size = 60 }: { id: AppId; icon: IconName; label?: string; size?: number }) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const dragging = useRef(false);

  const onPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    start.current = { x: e.clientX, y: e.clientY };
    dragging.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const s = start.current;
    if (!s) return;
    if (!dragging.current && Math.hypot(e.clientX - s.x, e.clientY - s.y) > DRAG_START) {
      dragging.current = true;
      haptic();
    }
    if (dragging.current) usePad.getState().setDrag({ id, x: e.clientX, y: e.clientY, zone: zoneAt(e.clientX) });
  };
  const onPointerUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const wasDragging = dragging.current;
    start.current = null;
    dragging.current = false;
    usePad.getState().setDrag(null);
    drop(id, wasDragging ? zoneAt(e.clientX) : "open");
  };

  return (
    <button
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        start.current = null;
        usePad.getState().setDrag(null);
      }}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), drop(id, "open"))}
      aria-label={label ? `${label}. Drag to the right edge for split view or slide-over.` : id}
      className="flex touch-none select-none flex-col items-center gap-1.5 rounded-xl p-1 transition-transform active:scale-95"
    >
      <AppIcon id={id} icon={icon} size={size} />
      {label && <span className="text-xs font-medium [text-shadow:0_1px_2px_rgb(0_0_0/0.3)]">{label}</span>}
    </button>
  );
}

const zoneLabel: Record<DropZone, string> = { open: "Open full screen", split: "Split view", slide: "Slide-over" };

// Drop targets and the icon following the pointer while dragging.
export function DragLayer() {
  const drag = usePad((s) => s.drag);
  const primary = usePad((s) => s.primary);
  if (!drag) return null;
  const app = getApp(drag.id);
  const zone = (z: DropZone, cls: string) => (
    <div className={`absolute inset-y-3 flex items-center justify-center rounded-3xl border-2 border-dashed text-sm font-semibold transition-colors ${cls} ${drag.zone === z ? "border-accent bg-accent/20 text-accent-fg" : "border-line-strong bg-ink/30 text-muted"}`}>
      {zoneLabel[z]}
    </div>
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-[17000]">
      {zone("open", primary ? "left-3 right-[51%]" : "left-3 right-[13%]")}
      {primary && zone("split", "left-[51%] right-[13%]")}
      {zone("slide", "left-[89%] right-3")}
      {app && (
        <div className="absolute -translate-x-1/2 -translate-y-1/2 scale-110 drop-shadow-2xl" style={{ left: drag.x, top: drag.y }}>
          <AppIcon id={app.id} icon={app.icon} size={64} />
        </div>
      )}
    </div>
  );
}

// The dock peeks up over an open app after a short swipe on the home bar,
// so apps can be dragged into split view or slide-over.
export function DockPeek() {
  const dockPeek = usePad((s) => s.dockPeek);
  const setDockPeek = usePad((s) => s.setDockPeek);
  if (!dockPeek) return null;
  const apps = pinned.map(getApp).filter((a): a is AppDefinition => !!a);
  return (
    <>
      <div className="absolute inset-0 z-[16500]" onClick={() => setDockPeek(false)} aria-hidden />
      <nav aria-label="Dock" className="folio-app-in absolute bottom-8 left-1/2 z-[16600] flex -translate-x-1/2 gap-2 rounded-[26px] border border-line bg-surface/70 p-2.5 shadow-3 backdrop-blur-2xl">
        {apps.map((a) => (
          <DragTile key={a.id} id={a.id} icon={a.icon} size={48} />
        ))}
      </nav>
    </>
  );
}
