"use client";

import { useStore } from "@/state/store";
import { BodyPanel } from "./BodyPanel";
import { Comms } from "./Comms";
import { LaunchHud } from "./LaunchHud";
import { MissionBrief } from "./MissionBrief";
import { OrbitHud } from "./OrbitHud";
import { TimeWarp } from "./TimeWarp";
import { TmiHud, TransitHud } from "./TransitHud";

/** Phase dependent panels. Loaded with the scene because it reads the scene's runtime state. */
export default function Hud() {
  const phase = useStore((s) => s.phase);
  const mode = useStore((s) => s.transitMode);
  // Warp makes no sense while docking choreography plays in real time.
  const warpAllowed = phase === "orbit" || (phase === "transit" && mode === "cruise");
  return (
    <>
      {phase === "pad" && <MissionBrief />}
      <LaunchHud />
      {phase === "orbit" && <OrbitHud />}
      {phase === "tmi" && <TmiHud />}
      {phase === "transit" && <TransitHud />}
      {/* The station panel takes the right side while docked. */}
      {(phase === "orbit" || (phase === "transit" && mode !== "docked")) && <BodyPanel />}
      {warpAllowed && <TimeWarp />}
      {phase !== "countdown" && phase !== "ascent" && <Comms />}
    </>
  );
}
