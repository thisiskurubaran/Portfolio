"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer, Noise, ToneMapping } from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import { NoToneMapping } from "three";
import { CameraRig } from "./CameraRig";
import { Earth } from "./Earth";
import { SkyClock } from "./SkyClock";
import { Starfield } from "./Starfield";
import { Sun } from "./Sun";

export default function Experience() {
  return (
    <Canvas
      dpr={[1, 2]}
      // Tone mapping runs once, at the end of the post chain, so the
      // renderer itself must output linear HDR.
      gl={{ antialias: false, toneMapping: NoToneMapping, powerPreference: "high-performance" }}
      camera={{ fov: 45, near: 0.05, far: 10_000 }}
    >
      <color attach="background" args={["#000000"]} />
      <SkyClock />
      <CameraRig />
      <Starfield />
      <Sun />
      <Suspense fallback={null}>
        <Earth />
      </Suspense>
      <EffectComposer multisampling={4}>
        <Bloom luminanceThreshold={1} luminanceSmoothing={0.2} intensity={0.9} mipmapBlur />
        <ToneMapping mode={ToneMappingMode.AGX} />
        <Noise opacity={0.025} blendFunction={BlendFunction.SOFT_LIGHT} />
      </EffectComposer>
    </Canvas>
  );
}
