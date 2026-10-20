"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, Group, Mesh, MeshBasicMaterial, Vector3 } from "three";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useSceneStore } from "@/state/store";
import { isInBeam } from "../beamState";
import { envRuntime } from "../envRuntime";
import { waveHeight } from "../seaRuntime";
import { SHIP_HEIGHT, SHIP_LENGTH, shipGeometry } from "./models";
import { RESCUE_ID, rescueRuntime } from "./rescueRuntime";
import { shipMaterial } from "./shipMaterial";
import { shipState } from "./shipRuntime";

const STORM_NEEDED = 0.6;
const SPAWN_AFTER_S = 6;
const HOLD_S = 5;
// Progress drains if the beam slips off, so it has to be held, not swept past.
const DRAIN_S = 1.5;
const GUIDE_S = 10;
// The far side of the jetty from the rowboat.
const DOCK = { x: 12.5, z: -6.8, heading: Math.PI / 2 };

// Morse SOS: three short, three long, three short. Unit 0.22 s, so the light
// changes at most a couple of times a second (photosensitivity).
const UNIT = 0.22;
const SOS = [1, 1, 1, 1, 1, 3, 3, 1, 3, 3, 1, 3, 3, 1, 1, 1, 1, 1, 1, 7];
const SOS_TOTAL = SOS.reduce((a, b) => a + b, 0) * UNIT;
function sosOn(t: number): boolean {
  let x = t % SOS_TOTAL;
  for (let i = 0; i < SOS.length; i++) {
    x -= SOS[i]! * UNIT;
    if (x < 0) return i % 2 === 0;
  }
  return false;
}

const lampMaterial = new MeshBasicMaterial({ color: "#ff3b2f", fog: false });
const flareMaterial = new MeshBasicMaterial({ color: "#ff6a3d", transparent: true, blending: AdditiveBlending, depthWrite: false, fog: false });
const probe = new Vector3();

const boat = {
  stormTime: 0,
  done: false,
  x: 0,
  z: 0,
  heading: 0,
  from: { x: 0, z: 0 },
  guideT: 0,
};

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/** F09: during a storm, a boat signals for help. Hold the beam on it to bring it in. */
export function RescueBoat() {
  const group = useRef<Group>(null);
  const lamp = useRef<Mesh>(null);
  const flare = useRef<Mesh>(null);
  const reducedMotion = useReducedMotion();

  useFrame(({ clock }, delta) => {
    const g = group.current;
    if (!g) return;
    const store = useSceneStore.getState();
    const phase = store.rescuePhase;
    const t = clock.elapsedTime;
    const storm = envRuntime.storm.value;

    if (phase === "idle") {
      // Needs a storm and the lamp lit; by day the beam is off.
      const ready = !boat.done && storm > STORM_NEEDED && envRuntime.daylight.value < 0.5;
      boat.stormTime = ready ? boat.stormTime + delta : 0;
      if (boat.stormTime > SPAWN_AFTER_S) {
        const yaw = (Math.random() - 0.5) * 1.6;
        const dist = 55 + Math.random() * 25;
        boat.x = -Math.sin(yaw) * dist;
        boat.z = -Math.cos(yaw) * dist;
        boat.heading = Math.random() * Math.PI * 2;
        rescueRuntime.progress = 0;
        store.setRescuePhase("distress");
      }
    } else if (phase === "distress") {
      if (storm < 0.4) {
        // The storm passed before anyone came; the boat makes its own way.
        rescueRuntime.progress = 0;
        store.setRescuePhase("idle");
      } else {
        probe.set(boat.x, 1, boat.z);
        rescueRuntime.progress = isInBeam(probe)
          ? Math.min(1, rescueRuntime.progress + delta / HOLD_S)
          : Math.max(0, rescueRuntime.progress - delta / DRAIN_S);
        if (rescueRuntime.progress >= 1) {
          boat.from = { x: boat.x, z: boat.z };
          boat.guideT = 0;
          store.setRescuePhase("guiding");
        }
      }
    } else if (phase === "guiding") {
      boat.guideT = Math.min(1, boat.guideT + delta / GUIDE_S);
      const k = ease(boat.guideT);
      const nx = boat.from.x + (DOCK.x - boat.from.x) * k;
      const nz = boat.from.z + (DOCK.z - boat.from.z) * k;
      if (boat.guideT < 0.95) boat.heading = Math.atan2(-(nx - boat.x), -(nz - boat.z));
      else boat.heading = DOCK.heading;
      boat.x = nx;
      boat.z = nz;
      if (boat.guideT >= 1) {
        boat.done = true;
        store.setRescuePhase("docked");
        store.select(RESCUE_ID);
      }
    }

    const visible = phase !== "idle";
    g.visible = visible;
    if (!visible) return;

    // Ride the water like the other hulls, tossed harder in the storm.
    const y = waveHeight(boat.x, boat.z);
    const fx = -Math.sin(boat.heading);
    const fz = -Math.cos(boat.heading);
    const bow = waveHeight(boat.x + fx * 3, boat.z + fz * 3);
    const stern = waveHeight(boat.x - fx * 3, boat.z - fz * 3);
    const k = 1 - Math.exp(-4 * delta);
    g.position.set(boat.x, g.position.y + (y - g.position.y) * k, boat.z);
    g.rotation.set(Math.atan2(bow - stern, 6) * (1 + storm), boat.heading, Math.sin(t * 1.3) * 0.12 * storm, "YXZ");

    const state = shipState(RESCUE_ID);
    state.length = SHIP_LENGTH.fishing;
    state.anchor.set(boat.x, g.position.y + SHIP_HEIGHT.fishing + 1, boat.z);
    // Its label is the rescue prompt, not the found-by-beam label.
    state.reveal = 0;

    if (lamp.current) lamp.current.visible = phase !== "distress" || reducedMotion || sosOn(t);
    if (flare.current) {
      // A flare goes up every few seconds while it waits for help.
      const cycle = (t % 6) / 6;
      const show = phase === "distress" && !reducedMotion && cycle < 0.6;
      flare.current.visible = show;
      flare.current.position.y = 4 + cycle * 40;
      flareMaterial.opacity = show ? 1 - cycle / 0.6 : 0;
    }
  });

  return (
    <group ref={group} visible={false}>
      <mesh geometry={shipGeometry("fishing")} material={shipMaterial()} />
      <mesh ref={lamp} position={[0, 4.3, -0.8]} material={lampMaterial}>
        <sphereGeometry args={[0.25, 8, 6]} />
      </mesh>
      <mesh ref={flare} material={flareMaterial} visible={false}>
        <sphereGeometry args={[0.6, 8, 6]} />
      </mesh>
    </group>
  );
}
