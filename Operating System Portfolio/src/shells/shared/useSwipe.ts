"use client";

import { useRef, type PointerEvent } from "react";

export type SwipeDirection = "up" | "down" | "left" | "right";

const MIN_DISTANCE = 40;

// Pointer events cover touch, pen and mouse, so the same gesture works with a
// trackpad drag on a laptop that has been switched to a touch shell.
export function useSwipe(onSwipe: (dir: SwipeDirection, start: { x: number; y: number }) => void) {
  const start = useRef<{ x: number; y: number } | null>(null);
  return {
    onPointerDown: (e: PointerEvent) => {
      start.current = { x: e.clientX, y: e.clientY };
    },
    onPointerUp: (e: PointerEvent) => {
      const s = start.current;
      start.current = null;
      if (!s) return;
      const dx = e.clientX - s.x;
      const dy = e.clientY - s.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < MIN_DISTANCE) return;
      if (Math.abs(dy) > Math.abs(dx)) onSwipe(dy < 0 ? "up" : "down", s);
      else onSwipe(dx < 0 ? "left" : "right", s);
    },
    onPointerCancel: () => {
      start.current = null;
    },
  };
}
