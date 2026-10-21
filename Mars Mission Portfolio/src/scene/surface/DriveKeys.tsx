"use client";

import { useEffect } from "react";
import { useStore } from "@/state/store";
import { progress } from "../astronaut/guideRuntime";
import { driveInput } from "./roverState";

/** W/S or up/down to drive, A/D or left/right to steer, space to brake. */
export function DriveKeys() {
  const phase = useStore((s) => s.phase);

  useEffect(() => {
    if (phase !== "surface") return;
    const held = new Set<string>();
    const apply = () => {
      const fwd = held.has("w") || held.has("arrowup");
      const back = held.has("s") || held.has("arrowdown");
      const left = held.has("a") || held.has("arrowleft");
      const right = held.has("d") || held.has("arrowright");
      driveInput.throttle = (fwd ? 1 : 0) - (back ? 1 : 0);
      driveInput.steer = (left ? 1 : 0) - (right ? 1 : 0);
      driveInput.brake = held.has(" ");
    };
    const down = (e: KeyboardEvent) => {
      // On foot, the astronaut's keys are in charge.
      if (!progress.inRover) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      const k = e.key.toLowerCase();
      if (!["w", "a", "s", "d", " ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) return;
      // Space would otherwise press whichever button has focus.
      if (k === " " && el?.tagName === "BUTTON") return;
      e.preventDefault();
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
      clear();
    };
  }, [phase]);

  return null;
}
