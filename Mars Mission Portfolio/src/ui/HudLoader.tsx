"use client";

import dynamic from "next/dynamic";

// Shares the scene's chunk (three and the mission runtime), so it stays out of the first load.
const Hud = dynamic(() => import("./Hud"), { ssr: false });

export function HudLoader() {
  return <Hud />;
}
