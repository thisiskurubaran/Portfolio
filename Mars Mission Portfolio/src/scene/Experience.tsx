"use client";

import { Suspense } from "react";
import { Canvas, createPortal } from "@react-three/fiber";
import { NoToneMapping } from "three";
import { CameraDirector } from "./CameraDirector";
import { Rocket } from "./craft/Rocket";
import { Earth } from "./Earth";
import { LaunchSite } from "./launch/LaunchSite";
import { LocalEnvironment } from "./LocalEnvironment";
import { LocalLights } from "./LocalLights";
import { PhaseDriver } from "./PhaseDriver";
import { Planets } from "./Planets";
import { Renderer } from "./Renderer";
import { skyCamera, skyScene } from "./skyLayer";
import { Starfield } from "./Starfield";
import { Sun } from "./Sun";

function SkyLayer() {
  return (
    <>
      <Starfield />
      <Planets />
      <Sun />
      <Suspense fallback={null}>
        <Earth />
      </Suspense>
    </>
  );
}

export default function Experience() {
  return (
    <Canvas
      dpr={[1, 2]}
      // Tone mapping runs once, at the end of the post chain, so the
      // renderer itself must output linear HDR.
      gl={{ antialias: false, toneMapping: NoToneMapping, powerPreference: "high-performance" }}
      camera={{ fov: 45, near: 0.5, far: 60_000 }}
    >
      <PhaseDriver />
      {/* Pointer events in the sky layer raycast with the sky camera. */}
      {createPortal(<SkyLayer />, skyScene, { camera: skyCamera })}
      <LocalLights />
      <LocalEnvironment />
      <LaunchSite />
      <Rocket />
      <CameraDirector />
      <Renderer />
    </Canvas>
  );
}
