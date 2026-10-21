"use client";

import { useStore } from "@/state/store";
import { BodyPanel } from "./BodyPanel";
import { LaunchHud } from "./LaunchHud";
import { MissionBrief } from "./MissionBrief";
import { OrbitHud } from "./OrbitHud";
import { TimeWarp } from "./TimeWarp";

/** Phase dependent panels. Loaded with the scene because it reads the scene's runtime state. */
export default function Hud() {
  const phase = useStore((s) => s.phase);
  return (
    <>
      {phase === "pad" && <MissionBrief />}
      <LaunchHud />
      {phase === "orbit" && (
        <>
          <OrbitHud />
          <BodyPanel />
          <TimeWarp />
        </>
      )}
    </>
  );
}
