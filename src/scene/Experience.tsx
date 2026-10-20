"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect } from "react";
import { useSceneStore } from "@/state/store";
import { BeamController } from "./BeamController";
import { CameraRig } from "./CameraRig";
import { Island } from "./Island";
import { NIGHT } from "./palette";
import { Sea } from "./Sea";
import { Sky } from "./Sky";

function useDevSeaParam() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    // ?sea=0.8 to check wave presets while the barometer UI does not exist yet.
    const raw = new URLSearchParams(window.location.search).get("sea");
    if (raw !== null && !Number.isNaN(Number(raw))) {
      useSceneStore.getState().setSeaState(Number(raw));
    }
  }, []);
}

export default function Experience() {
  useDevSeaParam();

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
      <CameraRig />
      <Sky />
      <Sea />
      <Island />
    </Canvas>
  );
}
