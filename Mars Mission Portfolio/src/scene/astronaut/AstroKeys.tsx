"use client";

import { useEffect } from "react";
import { astroInput, interact } from "./astronautRuntime";
import { leaveRover, progress } from "./guideRuntime";

const MOVE = ["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", " ", "shift", "x"];

/** Use whatever is in reach: the prompt's action, or climbing out of the rover. */
export function doInteract(): void {
  if (interact.near) interact.near.act();
  else if (progress.inRover) leaveRover();
}

/**
 * Keys for the astronaut: W A S D or arrows to move, Space up or jump,
 * Shift down or jog, X to stop drifting, E to use. While driving, the
 * rover's own keys take over and only E (climb out) is read here.
 */
export function AstroKeys() {
  useEffect(() => {
    const held = new Set<string>();
    const apply = () => {
      astroInput.forward = (held.has("w") || held.has("arrowup") ? 1 : 0) - (held.has("s") || held.has("arrowdown") ? 1 : 0);
      astroInput.right = (held.has("d") || held.has("arrowright") ? 1 : 0) - (held.has("a") || held.has("arrowleft") ? 1 : 0);
      astroInput.up = held.has(" ");
      astroInput.down = held.has("shift");
      astroInput.stabilise = held.has("x");
    };
    const typing = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
    };
    const down = (e: KeyboardEvent) => {
      if (typing(e)) return;
      const k = e.key.toLowerCase();
      if (k === "e" && !e.repeat) {
        doInteract();
        return;
      }
      if (progress.inRover || !MOVE.includes(k)) return;
      // Space would otherwise press whichever button has focus.
      if (k === " " && (e.target as HTMLElement | null)?.tagName === "BUTTON") return;
      if (k !== "shift") e.preventDefault();
      held.add(k);
      apply();
    };
    const up = (e: KeyboardEvent) => {
      held.delete(e.key.toLowerCase());
      apply();
    };
    const clear = () => {
      held.clear();
      apply();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
    };
  }, []);
  return null;
}
