"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect } from "react";
import { useSceneStore } from "@/state/store";
import { Beam } from "./Beam";
import { BeamController } from "./BeamController";
import { aimAt, beamRuntime } from "./beamState";
import { shipRuntime } from "./ships/shipRuntime";
import { CameraRig } from "./CameraRig";
import { Island } from "./Island";
import { NIGHT } from "./palette";
import { Sea } from "./Sea";
import { Sky } from "./Sky";
import { Ships } from "./ships/Ships";
import { ShipTracker } from "./ships/ShipTracker";

function useDevHooks() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    // Handle for poking at the scene from the console while developing.
    Object.assign(window, { __scene: { store: useSceneStore, beam: beamRuntime, ships: shipRuntime, aimAt } });

    // ?sea=0.8 to check wave presets while the barometer UI does not exist yet.
    const raw = new URLSearchParams(window.location.search).get("sea");
    if (raw !== null && !Number.isNaN(Number(raw))) {
      useSceneStore.getState().setSeaState(Number(raw));
    }
  }, []);
}

export default function Experience() {
  useDevHooks();

  return (
    <Canvas
      flat
      dpr={[1, 1.75]}
      camera={{ fov: 55, near: 0.1, far: 1000 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <color attach="background" args={[NIGHT.horizon]} />
      <fog attach="fog" args={[NIGHT.horizon, NIGHT.fogNear, NIGHT.fogFar]} />
      <BeamController />
      <Sky />
      <Sea />
      <Island />
      <Ships />
      <Beam />
      {/* Last, so it follows anything that moved this frame. */}
      <CameraRig />
      <ShipTracker />
    </Canvas>
  );
}
