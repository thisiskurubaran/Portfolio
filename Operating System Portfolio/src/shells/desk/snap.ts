import type { Rect } from "@/os/state/windows";

export const MENU_BAR = 30;
export const DOCK_SPACE = 92;

export type SnapKind =
  | "left"
  | "right"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "left-third"
  | "center-third"
  | "right-third"
  | "left-two-thirds"
  | "right-two-thirds"
  | "fill";

const GAP = 6;

// Rects for snap layouts inside the area between the menu bar and the dock,
// with a small gap so snapped windows read as separate panes.
export function snapRect(kind: SnapKind): Rect {
  const W = window.innerWidth;
  const top = MENU_BAR + GAP;
  const H = window.innerHeight - MENU_BAR - DOCK_SPACE - GAP * 2;
  const half = (W - GAP * 3) / 2;
  const third = (W - GAP * 4) / 3;
  const halfH = (H - GAP) / 2;
  const at = (x: number, y: number, width: number, height: number): Rect => ({ x: Math.round(x), y: Math.round(y), width: Math.round(width), height: Math.round(height) });
  switch (kind) {
    case "left":
      return at(GAP, top, half, H);
    case "right":
      return at(GAP * 2 + half, top, half, H);
    case "top-left":
      return at(GAP, top, half, halfH);
    case "top-right":
      return at(GAP * 2 + half, top, half, halfH);
    case "bottom-left":
      return at(GAP, top + halfH + GAP, half, halfH);
    case "bottom-right":
      return at(GAP * 2 + half, top + halfH + GAP, half, halfH);
    case "left-third":
      return at(GAP, top, third, H);
    case "center-third":
      return at(GAP * 2 + third, top, third, H);
    case "right-third":
      return at(GAP * 3 + third * 2, top, third, H);
    case "left-two-thirds":
      return at(GAP, top, third * 2 + GAP, H);
    case "right-two-thirds":
      return at(GAP * 2 + third, top, third * 2 + GAP, H);
    case "fill":
      return at(GAP, top, W - GAP * 2, H);
  }
}
