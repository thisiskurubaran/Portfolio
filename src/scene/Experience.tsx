"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect } from "react";
import gsap from "gsap";
import { useSceneStore } from "@/state/store";
import { PRESETS, type PresetId } from "@/weather/presets";
import { RescueLabel } from "@/ui/RescueLabel";
import { ShipLabels } from "@/ui/ShipLabels";
import { StormLabels } from "@/ui/StormLabels";
import { FindLabel } from "@/ui/FindLabel";
import { lowTideFind } from "@/content/hidden";
import { wrecks } from "@/content/wrecks";
import { Beam } from "./Beam";
import { BeamController } from "./BeamController";
import { aimAt, beamRuntime } from "./beamState";
import { envRuntime } from "./envRuntime";
import { shipRuntime } from "./ships/shipRuntime";
import { CameraRig } from "./CameraRig";
import { ConditionsLoader } from "./ConditionsLoader";
import { EnvController } from "./EnvController";
import { FpsProbe } from "./FpsProbe";
import { Lightning } from "./Lightning";
import { Precipitation } from "./Precipitation";
import { Island } from "./Island";
import { NIGHT } from "./palette";
import { Sea } from "./Sea";
import { Sky } from "./Sky";
import { StormSwirls } from "./StormSwirls";
import { LOW_TIDE_ID, TideRocks } from "./TideRocks";
import { Wrecks } from "./Wrecks";
import { RescueBoat } from "./ships/RescueBoat";
import { Ships } from "./ships/Ships";
import { ShipTracker } from "./ships/ShipTracker";

function useDevHooks() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    // Handle for poking at the scene from the console while developing.
    Object.assign(window, { __scene: { store: useSceneStore, beam: beamRuntime, ships: shipRuntime, aimAt, gsap, env: envRuntime } });

    // ?sea=0.8 to check wave presets while the barometer UI does not exist yet.
    const raw = new URLSearchParams(window.location.search).get("sea");
    if (raw !== null && !Number.isNaN(Number(raw))) {
      useSceneStore.getState().setSeaOverride(Number(raw));
    }
    // ?preset=major to try a storm before the barometer exists.
    const presetParam = new URLSearchParams(window.location.search).get("preset");
    if (presetParam && presetParam in PRESETS) useSceneStore.getState().setWeatherPreset(presetParam as PresetId);
    // ?tide=-1 for low water, 1 for high.
    const tideParam = Number(new URLSearchParams(window.location.search).get("tide"));
    if (new URLSearchParams(window.location.search).has("tide") && Number.isFinite(tideParam)) {
      useSceneStore.getState().setTideOverride(Math.max(-1, Math.min(1, tideParam)));
    }
    // ?rain=0.8 or ?snow=0.8 to check precipitation without waiting for weather.
    const q = new URLSearchParams(window.location.search);
    for (const key of ["rain", "snow"] as const) {
      const v = Number(q.get(key));
      if (q.has(key) && Number.isFinite(v)) useSceneStore.getState().setPrecipOverride(key, v);
    }
  }, []);
}

function LowTideLabel() {
  const low = useSceneStore((s) => !!s.tide?.low);
  return <FindLabel id={LOW_TIDE_ID} title={lowTideFind.tag} tag={lowTideFind.title} active={low} />;
}

export default function Experience() {
  useDevHooks();

  // Labels live in this lazily loaded module because they read ship state,
  // which pulls in three. Keeping them out of the page keeps the first chunk small.
  return (
    <>
      <Canvas
        flat
        dpr={[1, 1.75]}
        camera={{ fov: 55, near: 0.1, far: 1000 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        // A click on open water closes the panel, like clicking outside a dialog.
        onPointerMissed={() => useSceneStore.getState().closePanel()}
      >
        <color attach="background" args={[NIGHT.horizon]} />
        <fog attach="fog" args={[NIGHT.horizon, NIGHT.fogNear, NIGHT.fogFar]} />
        <EnvController />
        <BeamController />
        <Sky />
        <StormSwirls />
        <Sea />
        <Island />
        <TideRocks />
        <Wrecks />
        <Ships />
        <RescueBoat />
        <Beam />
        <Precipitation />
        <Lightning />
        {/* Last, so it follows anything that moved this frame. */}
        <CameraRig />
        <ShipTracker />
        <FpsProbe />
      </Canvas>
      <ShipLabels />
      <RescueLabel />
      <StormLabels />
      <LowTideLabel />
      {/* Always tab stops: focusing one tilts the beam down onto it and clears the water. */}
      {wrecks.map((w) => (
        <FindLabel key={w.id} id={w.id} title={w.title} tag={w.tag} active />
      ))}
      <ConditionsLoader />
    </>
  );
}
