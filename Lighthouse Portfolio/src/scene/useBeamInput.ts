"use client";

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { BEAM_YAW_LIMIT, useSceneStore } from "@/state/store";

export type HeldKeys = { left: boolean; right: boolean; up: boolean; down: boolean };

const KEYMAP: Record<string, keyof HeldKeys> = {
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
  ArrowUp: "up",
  KeyW: "up",
  ArrowDown: "down",
  KeyS: "down",
};

function isTyping(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
}

/**
 * Pointer, touch, wheel and key input for the beam. Mouse position maps
 * straight to a heading so the beam sits under the cursor; touch is relative
 * because a thumb covers the screen and absolute jumps feel wrong there.
 * Held keys are returned so the frame loop can turn at a steady rate.
 */
export function useBeamInput() {
  const el = useThree((s) => s.gl.domElement);
  const keys = useRef<HeldKeys>({ left: false, right: false, up: false, down: false });

  useEffect(() => {
    const store = useSceneStore.getState;
    const touches = new Map<number, { x: number; y: number }>();
    let pinchDist = 0;

    const spread = () => {
      const [a, b] = [...touches.values()];
      return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== "touch") return;
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touches.size === 2) pinchDist = spread();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse") {
        const nx = (e.clientX / window.innerWidth) * 2 - 1;
        store().setBeamTarget(-nx * BEAM_YAW_LIMIT, store().beamTarget.tilt);
        return;
      }
      const prev = touches.get(e.pointerId);
      if (!prev) return;
      const dx = e.clientX - prev.x;
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (touches.size === 1) {
        store().nudgeBeam((-dx / window.innerWidth) * 2.4, 0);
      } else if (touches.size === 2) {
        const d = spread();
        // Fingers apart reaches further out, like zooming in on the horizon.
        store().nudgeBeam(0, ((d - pinchDist) / window.innerHeight) * 1.6);
        pinchDist = d;
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      touches.delete(e.pointerId);
      if (touches.size === 2) pinchDist = spread();
    };

    const onWheel = (e: WheelEvent) => {
      store().nudgeBeam(0, -e.deltaY * 0.0009);
    };

    const setKey = (e: KeyboardEvent, down: boolean) => {
      const k = KEYMAP[e.code];
      if (!k || isTyping(e.target)) return;
      if (down) e.preventDefault();
      keys.current[k] = down;
    };
    const onKeyDown = (e: KeyboardEvent) => setKey(e, true);
    const onKeyUp = (e: KeyboardEvent) => setKey(e, false);
    // A key released while the tab is hidden never fires keyup.
    const onBlur = () => Object.assign(keys.current, { left: false, right: false, up: false, down: false });

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);
    el.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
      el.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [el]);

  return keys;
}
