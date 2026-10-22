"use client";

import { Suspense, useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { Icon } from "@/design/icons";
import { appComponents, getApp } from "@/os/apps/registry";
import { useWindows, type WindowState } from "@/os/state/windows";
import { useFocusTrap } from "@/shells/shared/useFocusTrap";

const MENU_BAR = 28;
const DOCK = 84;
const SNAP_EDGE = 8;

function useRaf() {
  const frame = useRef(0);
  return (fn: () => void) => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(fn);
  };
}

export function DeskWindow({ win, focused }: { win: WindowState; focused: boolean }) {
  const { close, focus, minimize, toggleMaximize, setRect } = useWindows();
  const app = getApp(win.appId);
  const ref = useRef<HTMLDivElement>(null);
  const schedule = useRaf();
  const Content = appComponents[win.appId];
  const trap = useFocusTrap(ref);

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
      const areaH = window.innerHeight - MENU_BAR - DOCK;
      if (ev.clientY <= SNAP_EDGE) {
        toggleMaximize(win.id);
      } else if (lastX <= SNAP_EDGE) {
        setRect(win.id, { x: 0, y: MENU_BAR, width: window.innerWidth / 2, height: areaH });
      } else if (lastX >= window.innerWidth - SNAP_EDGE) {
        setRect(win.id, { x: window.innerWidth / 2, y: MENU_BAR, width: window.innerWidth / 2, height: areaH });
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
      className={`absolute left-0 top-0 flex flex-col overflow-hidden rounded-window border border-line bg-ink/95 shadow-2xl backdrop-blur-xl outline-none ${focused ? "ring-1 ring-accent/50" : "opacity-95"}`}
      style={{ ...style, zIndex: win.z }}
    >
      <div
        onPointerDown={startDrag}
        onDoubleClick={() => toggleMaximize(win.id)}
        className="flex h-9 shrink-0 cursor-default select-none items-center gap-2 border-b border-line px-3"
      >
        <div className="flex gap-2">
          <button aria-label={`Close ${app.name}`} onClick={() => close(win.id)} className="h-3 w-3 rounded-full bg-red-400/90 focus-visible:ring-2" />
          <button aria-label={`Minimise ${app.name}`} onClick={() => minimize(win.id)} className="h-3 w-3 rounded-full bg-yellow-300/90 focus-visible:ring-2" />
          <button aria-label={win.maximized ? `Restore ${app.name}` : `Maximise ${app.name}`} onClick={() => toggleMaximize(win.id)} className="h-3 w-3 rounded-full bg-green-400/90 focus-visible:ring-2" />
        </div>
        <span className="mx-auto flex items-center gap-1.5 text-sm opacity-80">
          <Icon name={app.icon} size={14} />
          {app.name}
        </span>
        <span className="w-12" />
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <Suspense fallback={<p className="p-6 text-sm opacity-60">Loading</p>}>{Content && <Content />}</Suspense>
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
