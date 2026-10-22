"use client";

import { Suspense, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { AppIcon } from "@/design/AppIcon";
import { Icon, type IconName } from "@/design/icons";
import { Skeleton } from "@/os/apps/ui";
import { appComponents, getApp } from "@/os/apps/registry";
import { desktopOf, DESKTOPS, useWindows, type WindowState } from "@/os/state/windows";
import { useFocusTrap } from "@/shells/shared/useFocusTrap";
import { DOCK_SPACE as DOCK, MENU_BAR, snapRect, type SnapKind } from "./snap";
import { SnapPicker } from "./SnapPicker";
import { useDesk } from "./state";

const SNAP_EDGE = 8;
const CORNER = 60;

function useRaf() {
  const frame = useRef(0);
  return (fn: () => void) => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(fn);
  };
}

// Original window controls: quiet icon buttons on the right, with close
// turning red only on hover.
function WindowButton({ label, icon, onClick, danger = false }: { label: string; icon: IconName; onClick: () => void; danger?: boolean }) {
  return (
    <button
      aria-label={label}
      title={label.split(" ")[0]}
      onClick={onClick}
      className={`flex h-7 w-8 items-center justify-center rounded-md text-muted transition-colors hover:text-paper ${
        danger ? "hover:bg-danger hover:text-white" : "hover:bg-glass-strong"
      }`}
    >
      <Icon name={icon} size={14} weight={1.8} />
    </button>
  );
}

export function DeskWindow({ win, focused }: { win: WindowState; focused: boolean }) {
  const { close, focus, minimize, toggleMaximize, setRect } = useWindows();
  const app = getApp(win.appId);
  const ref = useRef<HTMLDivElement>(null);
  const schedule = useRaf();
  const Content = appComponents[win.appId];
  const trap = useFocusTrap(ref);
  // The snap picker appears after a short hover, so passing over the button does not flash it.
  const [snapOpen, setSnapOpen] = useState(false);
  const snapTimer = useRef(0);
  const openSnap = () => {
    window.clearTimeout(snapTimer.current);
    snapTimer.current = window.setTimeout(() => setSnapOpen(true), 450);
  };
  const closeSnap = () => {
    window.clearTimeout(snapTimer.current);
    snapTimer.current = window.setTimeout(() => setSnapOpen(false), 200);
  };

  useEffect(() => {
    // Content such as the terminal may already have focused its own input.
    if (focused && !ref.current?.contains(document.activeElement)) ref.current?.focus({ preventScroll: true });
  }, [focused]);

  if (!app) return null;

  const startDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (win.maximized || e.button !== 0 || (e.target as HTMLElement).closest("button")) return;
    const el = ref.current;
    if (!el) return;
    focus(win.id);
    const startX = e.clientX;
    const startY = e.clientY;
    let x = win.x;
    let y = win.y;
    let lastX = startX;
    e.currentTarget.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      lastX = ev.clientX;
      x = win.x + ev.clientX - startX;
      y = Math.max(MENU_BAR, win.y + ev.clientY - startY);
      schedule(() => {
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      // Edges snap to halves, corners to quarters, the top edge maximises.
      const nearTop = ev.clientY <= MENU_BAR + CORNER;
      const nearBottom = ev.clientY >= window.innerHeight - DOCK - CORNER;
      let snap: SnapKind | null = null;
      if (lastX <= SNAP_EDGE) snap = nearTop ? "top-left" : nearBottom ? "bottom-left" : "left";
      else if (lastX >= window.innerWidth - SNAP_EDGE) snap = nearTop ? "top-right" : nearBottom ? "bottom-right" : "right";
      if (snap) {
        setRect(win.id, snapRect(snap));
      } else if (ev.clientY <= SNAP_EDGE) {
        toggleMaximize(win.id);
      } else {
        setRect(win.id, { x, y, width: win.width, height: win.height });
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const startResize = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || win.maximized) return;
    e.stopPropagation();
    focus(win.id);
    const startX = e.clientX;
    const startY = e.clientY;
    let w = win.width;
    let h = win.height;
    const move = (ev: PointerEvent) => {
      w = Math.max(320, win.width + ev.clientX - startX);
      h = Math.max(220, win.height + ev.clientY - startY);
      schedule(() => {
        el.style.width = `${w}px`;
        el.style.height = `${h}px`;
      });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      setRect(win.id, { x: win.x, y: win.y, width: w, height: h });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const style = win.maximized
    ? { transform: `translate(0px, ${MENU_BAR}px)`, width: "100vw", height: `calc(100vh - ${MENU_BAR + DOCK}px)` }
    : { transform: `translate(${win.x}px, ${win.y}px)`, width: win.width, height: win.height };

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={app.name}
      tabIndex={-1}
      hidden={win.minimized}
      onPointerDown={() => !focused && focus(win.id)}
      onKeyDown={(e) => {
        if (e.key === "Escape") close(win.id);
        else trap(e);
      }}
      className={`folio-window absolute left-0 top-0 flex flex-col overflow-hidden rounded-window border bg-surface outline-none transition-shadow ${
        focused ? "border-line-strong shadow-3" : "border-line shadow-2"
      }`}
      style={{ ...style, zIndex: win.z }}
    >
      <div
        onPointerDown={startDrag}
        onDoubleClick={() => toggleMaximize(win.id)}
        onContextMenu={(e) => {
          e.preventDefault();
          focus(win.id);
          useDesk.getState().openMenu({
            x: e.clientX,
            y: e.clientY,
            label: `${app.name} window`,
            items: [
              { label: "Minimise", icon: "minimize", onSelect: () => minimize(win.id) },
              { label: win.maximized ? "Restore" : "Maximise", icon: win.maximized ? "restore" : "maximize", onSelect: () => toggleMaximize(win.id) },
              { separator: true },
              { label: "Snap left", onSelect: () => setRect(win.id, snapRect("left")) },
              { label: "Snap right", onSelect: () => setRect(win.id, snapRect("right")) },
              { label: "Centre third", onSelect: () => setRect(win.id, snapRect("center-third")) },
              { separator: true },
              ...Array.from({ length: DESKTOPS }, (_, i) => i + 1)
                .filter((n) => n !== desktopOf(win))
                .map((n) => ({ label: `Move to desktop ${n}`, onSelect: () => useWindows.getState().moveToDesktop(win.id, n) })),
              { separator: true },
              { label: "Close", icon: "close", danger: true, onSelect: () => close(win.id) },
            ],
          });
        }}
        className={`flex h-10 shrink-0 cursor-default select-none items-center gap-2.5 border-b border-line pl-3 pr-1.5 ${focused ? "bg-raised" : "bg-surface"}`}
      >
        <AppIcon id={app.id} icon={app.icon} size={20} />
        <span className={`truncate text-[13px] font-semibold ${focused ? "" : "text-muted"}`}>{app.name}</span>
        <div className="ml-auto flex items-center gap-0.5">
          <WindowButton label={`Minimise ${app.name}`} icon="minimize" onClick={() => minimize(win.id)} />
          <div className="relative" onPointerEnter={openSnap} onPointerLeave={closeSnap}>
            <WindowButton label={win.maximized ? `Restore ${app.name}` : `Maximise ${app.name}`} icon={win.maximized ? "restore" : "maximize"} onClick={() => toggleMaximize(win.id)} />
            {snapOpen && (
              <div className="absolute right-0 top-8 z-10">
                <SnapPicker
                  onPick={(kind) => {
                    setSnapOpen(false);
                    setRect(win.id, snapRect(kind));
                  }}
                />
              </div>
            )}
          </div>
          <WindowButton label={`Close ${app.name}`} icon="close" danger onClick={() => close(win.id)} />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <Suspense fallback={<Skeleton />}>{Content && <Content />}</Suspense>
      </div>
      {!win.maximized && (
        <div
          onPointerDown={startResize}
          aria-hidden
          className="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize"
        />
      )}
    </div>
  );
}
