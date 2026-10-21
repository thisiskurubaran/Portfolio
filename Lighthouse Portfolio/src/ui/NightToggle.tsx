"use client";

import { ui } from "@/content/ui";
import { useSceneStore } from "@/state/store";

/** F04: during the day the scene is harbor mode; this lets visitors jump to night. */
export function NightToggle() {
  const sunUp = useSceneStore((s) => s.sunUp);
  const forceNight = useSceneStore((s) => s.forceNight);
  if (!sunUp) return null;

  return (
    <button
      type="button"
      className="corner-button"
      aria-pressed={forceNight}
      title={ui.harbor.hint}
      onClick={() => useSceneStore.getState().setForceNight(!forceNight)}
    >
      {ui.harbor.night}
    </button>
  );
}
