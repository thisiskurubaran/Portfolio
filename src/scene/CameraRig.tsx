"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { PerspectiveCamera, Vector3 } from "three";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useSceneStore } from "@/state/store";
import { beamRuntime } from "./beamState";
import { LANTERN_Y } from "./layout";
import { shipRuntime } from "./ships/shipRuntime";

// Just behind and above the lantern room, looking out over the water.
const HOME = new Vector3(4, LANTERN_Y + 9, 11);
const TARGET = new Vector3(-1, 2, -45);
// The camera turns part of the way with the beam, so the beam can reach the
// edge of the view without the camera swinging the full arc. Portrait
// screens see a narrow slice of sea, so they follow more closely.
const FOLLOW_WIDE = 0.6;
const FOLLOW_TALL = 0.88;
const EASE = 2.5;
// Matches the panel width in globals.css, so the open ship sits beside it.
const PANEL_WIDTH = 420;
const PANEL_SHEET_SHARE = 0.55;

const up = new Vector3(0, 1, 0);
const homePos = new Vector3();
const homeLook = new Vector3();
const shipPos = new Vector3();
const shipLook = new Vector3();
const away = new Vector3();
const side = new Vector3();

export function CameraRig() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);
  const reducedMotion = useReducedMotion();
  const yaw = useRef(0);
  // 0 at the tower, 1 at the open ship. Tweened by GSAP, read every frame.
  const focus = useRef({ value: 0 });
  const focusId = useRef<string | null>(null);

  useEffect(() => {
    camera.position.copy(HOME);
    camera.lookAt(TARGET);
  }, [camera]);

  useEffect(() => {
    const f = focus.current;
    return useSceneStore.subscribe((s, prev) => {
      if (s.panelOpen === prev.panelOpen && s.selectedId === prev.selectedId) return;
      if (s.panelOpen) focusId.current = s.selectedId;
      gsap.to(f, {
        value: s.panelOpen ? 1 : 0,
        // No swoop for people who asked for less motion: cut straight there.
        duration: reducedMotion ? 0 : 1.6,
        ease: "power2.inOut",
        overwrite: true,
      });
    });
  }, [reducedMotion]);

  useFrame(({ clock }, delta) => {
    const follow = size.width < size.height ? FOLLOW_TALL : FOLLOW_WIDE;
    yaw.current += (beamRuntime.yaw * follow - yaw.current) * (1 - Math.exp(-EASE * delta));

    homePos.copy(HOME).applyAxisAngle(up, yaw.current);
    homeLook.copy(TARGET).applyAxisAngle(up, yaw.current);

    if (!reducedMotion) {
      // A slow sway so the view feels like standing in a tower in the wind.
      const t = clock.elapsedTime;
      homePos.x += Math.sin(t * 0.23) * 0.12;
      homePos.y += Math.sin(t * 0.31) * 0.08;
    }

    const f = focus.current.value;
    const ship = focusId.current ? shipRuntime.get(focusId.current) : undefined;
    if (ship && f > 0) {
      // Stand off on the lighthouse side of the ship and step to one side,
      // so the camera is out of the beam that keeps the ship lit.
      away.set(ship.anchor.x - beamRuntime.origin.x, 0, ship.anchor.z - beamRuntime.origin.z).normalize();
      side.set(-away.z, 0, away.x);
      const dist = 6 + ship.length * 1.2;
      shipLook.copy(ship.anchor).addScaledVector(up, -ship.length * 0.15);
      shipPos
        .copy(shipLook)
        .addScaledVector(away, -dist * 0.75)
        .addScaledVector(side, dist * 0.7)
        .addScaledVector(up, dist * 0.35);
      camera.position.lerpVectors(homePos, shipPos, f);
      camera.lookAt(homeLook.lerp(shipLook, f));
    } else {
      camera.position.copy(homePos);
      camera.lookAt(homeLook);
    }

    // Shift the picture so the ship sits in the space the panel leaves free:
    // left of a side panel on wide screens, above the bottom sheet on phones.
    if (f > 0.001) {
      const wide = size.width >= 768;
      const x = wide ? (PANEL_WIDTH / 2) * f : 0;
      const y = wide ? 0 : ((size.height * PANEL_SHEET_SHARE) / 2) * f;
      camera.setViewOffset(size.width, size.height, x, y, size.width, size.height);
    } else if (camera.view?.enabled) {
      camera.clearViewOffset();
    }
  });

  return null;
}
