"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Euler, Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useStore } from "@/state/store";
import { JOINT_HEIGHT } from "./craft/Rocket";
import { EVENTS } from "./launch/ascentProfile";
import { local } from "./localRuntime";
import { ascent } from "./missionRuntime";

/** Camera on the pad: low, off to the south east, looking up the stack. */
const PAD_CAMERA = new Vector3(70, -JOINT_HEIGHT + 8, 95);
const PAD_TARGET = new Vector3(0, -JOINT_HEIGHT / 2, 0);
/** In orbit: off to one side, a little behind and above, with Earth below in frame. */
const ORBIT_CAMERA = new Vector3(-12, 7, 26);

/** Docking view looks at a point between ship and station. */
const STATION_TARGET = new Vector3(18, 0, 0);
const UP = new Vector3(0, 1, 0);
const sideways = new Vector3();

/** Portrait screens are narrow, so the camera backs off until the arrays fit across. */
function orbitCamera(aspect: number): Vector3 {
  return ORBIT_CAMERA.clone().multiplyScalar(aspect < 1 ? Math.min(1 / aspect, 2.2) : 1);
}

const desired = new Vector3();
const look = new Vector3();
const rocketRot = new Euler();
const shake = new Vector3();

/**
 * Scripted camera for the launch (a cinematic moment, kept apart from the
 * physics) and free look with orbit controls on the pad and in orbit.
 */
export function CameraDirector() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const controls = useRef<OrbitControlsImpl>(null);
  const phase = useStore((s) => s.phase);
  const transitMode = useStore((s) => s.transitMode);
  const reduced = useReducedMotion();
  const freeLook = phase !== "ascent";
  const onPad = phase === "pad" || phase === "countdown";
  const previous = useRef(phase);
  const placed = useRef(false);

  useEffect(() => {
    // Only on a phase change; a resize alone must not move the camera.
    if (placed.current && previous.current === phase) return;
    placed.current = true;
    if (phase === "pad") {
      camera.position.copy(PAD_CAMERA);
      controls.current?.target.copy(PAD_TARGET);
    }
    if (phase === "orbit") {
      controls.current?.target.set(0, 0, 0);
      // After a flown ascent the camera is already in place; after a skip it is still on the pad.
      if (previous.current !== "ascent") camera.position.copy(orbitCamera(size.width / size.height));
    }
    previous.current = phase;
    controls.current?.update();
  }, [phase, camera, size]);

  // Stations: pull back and look ahead so ship and station share the frame.
  useEffect(() => {
    if (phase !== "transit") return;
    if (transitMode === "approach") {
      controls.current?.target.copy(STATION_TARGET);
      // Stand on the Sun side, a little off its line, so ship and station are lit as seen.
      sideways.copy(local.sunDir).setY(0);
      if (sideways.lengthSq() < 1e-6) sideways.set(0, 0, 1);
      sideways.normalize().applyAxisAngle(UP, 0.5).multiplyScalar(70).setY(20);
      camera.position.copy(STATION_TARGET).add(sideways);
    } else if (transitMode === "cruise") {
      controls.current?.target.set(0, 0, 0);
    }
    controls.current?.update();
  }, [phase, transitMode, camera]);

  useFrame((_, delta) => {
    if (useStore.getState().phase !== "ascent") return;
    const t = ascent.t;
    const tilt = Math.PI / 2 - ascent.sample.pitch;
    rocketRot.set(0, 0, -tilt);

    if (t < 10) {
      // Ground camera: stays on the pad while the rocket climbs away from it.
      desired.copy(PAD_CAMERA);
      desired.x -= local.downrangeM;
      desired.y -= local.altitudeM;
      look.set(0, -JOINT_HEIGHT * 0.4, 0);
    } else if (t > EVENTS.meco - 4 && t < EVENTS.secondStageIgnition + 25) {
      // Side view of the stage joint for separation.
      desired.set(28, -24, 34).applyEuler(rocketRot);
      look.set(0, -18, 0).applyEuler(rocketRot);
    } else if (t > EVENTS.seco - 3) {
      desired.copy(orbitCamera(size.width / size.height));
      look.set(0, 0, 0);
    } else {
      // Chase view from below and behind the engines.
      desired.set(10, -70, 42).applyEuler(rocketRot);
      look.set(0, -26, 0).applyEuler(rocketRot);
    }

    const ease = t < 10 ? 1 : 1 - Math.exp(-delta * 1.2);
    camera.position.lerp(desired, ease);
    if (!reduced && t >= 0 && t < 30) {
      // Rumble through the hull and the ground, fading as the rocket climbs.
      const amp = 0.25 * (1 - t / 30);
      shake.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(amp);
      camera.position.add(shake);
    }
    camera.lookAt(look);
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enabled={freeLook}
      enablePan={false}
      enableDamping={!reduced}
      dampingFactor={0.08}
      minDistance={onPad ? 30 : 9}
      maxDistance={phase === "transit" ? 500 : onPad ? 400 : 300}
      // On the pad, keep the camera above the ground.
      maxPolarAngle={onPad ? Math.PI / 2 + 0.35 : Math.PI}
      rotateSpeed={0.5}
      zoomSpeed={0.6}
    />
  );
}
