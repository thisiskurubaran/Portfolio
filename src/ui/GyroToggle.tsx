"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ui } from "@/content/ui";
import { BEAM_YAW_LIMIT, useSceneStore } from "@/state/store";

// Degrees of phone tilt for a full sweep, picked so a wrist turn is enough.
const YAW_RANGE_DEG = 35;
const TILT_RANGE_DEG = 30;

type PermissionFn = () => Promise<"granted" | "denied">;

const coarse = "(pointer: coarse)";
function subscribe(onChange: () => void) {
  const mq = window.matchMedia(coarse);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
function canUseGyro() {
  return window.matchMedia(coarse).matches && "DeviceOrientationEvent" in window;
}

export function GyroToggle() {
  const available = useSyncExternalStore(subscribe, canUseGyro, () => false);
  const [enabled, setEnabled] = useState(false);
  const [denied, setDenied] = useState(false);
  const base = useRef<{ beta: number; gamma: number; tilt: number } | null>(null);

  useEffect(() => {
    if (!enabled) return;
    base.current = null;

    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta === null || e.gamma === null) return;
      // Whatever angle the phone is held at when steering starts is "centre".
      base.current ??= { beta: e.beta, gamma: e.gamma, tilt: useSceneStore.getState().beamTarget.tilt };
      const b = base.current;

      // In landscape the axes swap: side to side tilt is reported as beta.
      const angle = screen.orientation?.angle ?? 0;
      const landscape = angle === 90 || angle === 270;
      const sign = angle === 270 ? -1 : 1;
      const side = landscape ? sign * (e.beta - b.beta) : e.gamma - b.gamma;
      const forward = landscape ? -sign * (e.gamma - b.gamma) : e.beta - b.beta;

      useSceneStore
        .getState()
        .setBeamTarget((-side / YAW_RANGE_DEG) * BEAM_YAW_LIMIT, b.tilt - forward / TILT_RANGE_DEG);
    };

    window.addEventListener("deviceorientation", onOrientation);
    return () => window.removeEventListener("deviceorientation", onOrientation);
  }, [enabled]);

  if (!available) return null;

  const toggle = async () => {
    if (enabled) {
      setEnabled(false);
      return;
    }
    // iOS only hands out motion data after an explicit permission prompt
    // that has to come from a tap.
    const request = (DeviceOrientationEvent as unknown as { requestPermission?: PermissionFn }).requestPermission;
    if (request) {
      const result = await request().catch(() => "denied" as const);
      if (result !== "granted") {
        setDenied(true);
        return;
      }
    }
    setDenied(false);
    setEnabled(true);
  };

  // One fixed label with aria-pressed, so screen readers announce the state
  // instead of a label that changes under them.
  return (
    <>
      {denied && (
        <p className="corner-note" role="status">
          {ui.gyro.denied}
        </p>
      )}
      <button type="button" className="corner-button" aria-pressed={enabled} title={ui.gyro.hint} onClick={toggle}>
        {ui.gyro.label}
      </button>
    </>
  );
}
