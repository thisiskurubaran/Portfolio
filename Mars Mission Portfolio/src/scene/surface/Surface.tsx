"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BackSide,
  Color,
  DodecahedronGeometry,
  Float32BufferAttribute,
  type Group,
  type InstancedMesh,
  Matrix4,
  type Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Quaternion,
  ShaderMaterial,
  Vector3,
} from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import localVert from "@/shaders/local.vert";
import skydomeFrag from "@/shaders/skydome.frag";
import regolithFrag from "@/shaders/regolith.frag";
import { debris } from "@/content/debris";
import { base, deepDives, OPEN_RANGE_M } from "@/content/surface";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useStore } from "@/state/store";
import { materials } from "../craft/materials";
import { SM_HEIGHT } from "../craft/Spacecraft";
import { local } from "../localRuntime";
import { surface } from "../surfaceRuntime";
import { createRoverSim, ROVER, type RoverSim } from "./roverSim";
import { driveInput, roverState } from "./roverState";
import { makeTerrain, TERRAIN_CELLS, TERRAIN_SIZE_M, type Terrain } from "./terrain";

/** Ground level in the local frame: the lander's engine bell rests on it. */
export const GROUND_Y = -(SM_HEIGHT + 1.6);
// Clear of the lander's arrays, facing east.
const ROVER_START = { x: 16, z: 8 };

const MARS_SKY = {
  uZenith: { value: new Color(0.42, 0.3, 0.2) },
  uHorizon: { value: new Color(0.78, 0.58, 0.4) },
  uSunset: { value: new Color(0.35, 0.5, 0.9) },
  uHalo: { value: new Color(0.75, 0.85, 1.0) },
};
const groundUniforms = {
  uSunColor: { value: new Color() },
  uHaze: { value: new Color(0.7, 0.5, 0.34) },
};

function terrainGeometry(t: Terrain) {
  const g = new PlaneGeometry(TERRAIN_SIZE_M, TERRAIN_SIZE_M, TERRAIN_CELLS, TERRAIN_CELLS);
  g.rotateX(-Math.PI / 2);
  const pos = g.getAttribute("position");
  const uv: number[] = [];
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    pos.setY(i, t.height(x, z));
    uv.push(x, z);
  }
  g.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

const regolith = new MeshStandardMaterial({ color: "#5a3a26", roughness: 0.95 });
const habitat = new MeshStandardMaterial({ color: "#e8e6e0", roughness: 0.6 });
const glass = new MeshStandardMaterial({ color: "#1b2c44", roughness: 0.15, metalness: 0.6 });
const tyre = new MeshStandardMaterial({ color: "#2a2a2c", roughness: 0.85 });
const beaconGlow = new MeshStandardMaterial({ color: "#7fe0c4", emissive: "#7fe0c4", emissiveIntensity: 2 });
const wreckMetal = new MeshStandardMaterial({ color: "#6e6560", roughness: 0.7, metalness: 0.4 });

function Rocks({ terrain }: { terrain: Terrain }) {
  const mesh = useRef<InstancedMesh>(null);
  const geometry = useMemo(() => new DodecahedronGeometry(1, 0), []);
  useEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const mat = new Matrix4();
    const q = new Quaternion();
    terrain.rocks.forEach((r, i) => {
      q.setFromAxisAngle(new Vector3(Math.sin(i), 1, Math.cos(i)).normalize(), i * 1.7);
      mat.compose(
        new Vector3(r.x, terrain.height(r.x, r.z) + r.size * 0.25, r.z),
        q,
        new Vector3(r.size, r.size * 0.7, r.size * 0.9),
      );
      m.setMatrixAt(i, mat);
    });
    m.instanceMatrix.needsUpdate = true;
  }, [terrain]);
  return <instancedMesh ref={mesh} args={[geometry, regolith, terrain.rocks.length]} />;
}

function Base({ terrain }: { terrain: Terrain }) {
  const y = terrain.height(base.at.x, base.at.z);
  return (
    <group position={[base.at.x, y, base.at.z]}>
      {[0, 1].map((i) => (
        <mesh key={i} material={habitat} position={[i * 9, 0, 0]}>
          <sphereGeometry args={[4, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
      ))}
      <mesh material={habitat} position={[4.5, 1.2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.1, 1.1, 3, 16]} />
      </mesh>
      {/* Solar field. */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} material={materials.cells} position={[-8, 1.2, -6 + i * 4]} rotation={[-0.5, 0, 0]}>
          <boxGeometry args={[6, 0.05, 3]} />
        </mesh>
      ))}
      <mesh material={materials.frame} position={[14, 3, 3]}>
        <cylinderGeometry args={[0.1, 0.1, 6, 8]} />
      </mesh>
      <mesh material={habitat} position={[14, 6, 3]} rotation={[0.6, 0, 0]}>
        <sphereGeometry args={[1.5, 24, 8, 0, Math.PI * 2, 0, Math.PI / 3]} />
      </mesh>
    </group>
  );
}

function Beacons({ terrain }: { terrain: Terrain }) {
  const rings = useRef<(Mesh | null)[]>([]);
  const reduced = useReducedMotion();
  useFrame(({ clock }) => {
    // A slow pulse, well under the three flashes a second limit.
    const k = reduced ? 1 : 1.4 + 0.6 * Math.sin(clock.elapsedTime * 1.5);
    beaconGlow.emissiveIntensity = k;
  });
  return (
    <>
      {deepDives.map((d, i) => {
        const y = terrain.height(d.at.x, d.at.z);
        return (
          <group key={d.id} position={[d.at.x, y, d.at.z]}>
            <mesh material={materials.frame} position={[0, 2.5, 0]}>
              <cylinderGeometry args={[0.15, 0.25, 5, 8]} />
            </mesh>
            <mesh
              material={beaconGlow}
              position={[0, 5.2, 0]}
              ref={(m) => {
                rings.current[i] = m;
              }}
            >
              <torusGeometry args={[0.7, 0.12, 8, 24]} />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

/** Failed projects as derelict landers, in a ring around the landing zone. */
function Wrecks({ terrain }: { terrain: Terrain }) {
  return (
    <>
      {debris.map((d, i) => {
        const a = (i / Math.max(debris.length, 1)) * Math.PI * 2 + 0.4;
        const x = Math.cos(a) * 160;
        const z = Math.sin(a) * 160;
        return (
          <group key={d.id} position={[x, terrain.height(x, z), z]} rotation={[0.3, a, 0.5]}>
            <mesh material={wreckMetal}>
              <cylinderGeometry args={[1.4, 1.8, 1.6, 8]} />
            </mesh>
            <mesh material={materials.cells} position={[2.4, 0.3, 0]} rotation={[0, 0, 0.9]}>
              <boxGeometry args={[3, 0.05, 1.4]} />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

function RoverModel({ sim }: { sim: RoverSim | null }) {
  const group = useRef<Group>(null);
  const wheels = useRef<(Group | null)[]>([]);

  useFrame(() => {
    const g = group.current;
    if (!g || !sim) return;
    const t = sim.body.translation();
    const r = sim.body.rotation();
    g.position.set(t.x, t.y, t.z);
    g.quaternion.set(r.x, r.y, r.z, r.w);
    for (let i = 0; i < sim.wheels; i++) {
      const w = wheels.current[i];
      const c = sim.vehicle.wheelChassisConnectionPointCs(i);
      if (!w || !c) continue;
      const len = sim.vehicle.wheelSuspensionLength(i) ?? ROVER.suspensionRest;
      w.position.set(c.x, c.y - len, c.z);
      w.rotation.set(0, sim.vehicle.wheelSteering(i) ?? 0, 0);
      const spin = w.children[0];
      if (spin) spin.rotation.z = -(sim.vehicle.wheelRotation(i) ?? 0);
    }
  });

  const { x, y, z } = ROVER.half;
  return (
    <group ref={group}>
      <mesh material={habitat}>
        <boxGeometry args={[x * 2, y * 2, z * 2]} />
      </mesh>
      {/* Cab windows at the front, where the crew sits. */}
      <mesh material={glass} position={[x - 0.02, y * 0.3, 0]}>
        <boxGeometry args={[0.06, y * 0.9, z * 1.6]} />
      </mesh>
      <mesh material={materials.gold} position={[-x * 0.4, y + 0.15, 0]}>
        <boxGeometry args={[x * 0.9, 0.3, z * 1.4]} />
      </mesh>
      <mesh material={materials.cells} position={[-x * 0.4, y + 0.32, 0]}>
        <boxGeometry args={[x * 1.1, 0.04, z * 1.9]} />
      </mesh>
      {Array.from({ length: sim?.wheels ?? 6 }, (_, i) => (
        <group
          key={i}
          ref={(w) => {
            wheels.current[i] = w;
          }}
        >
          <mesh material={tyre} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[ROVER.wheelRadius, ROVER.wheelRadius, 0.45, 20]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

const follow = new Vector3();
const last = new Vector3();
const upAxis = new Vector3();
const fwdAxis = new Vector3();
const chassis = new Quaternion();
const chase = { reset: false };

/**
 * The surface: ground, rocks, base, beacons and the rover. Built in the
 * local frame around the landing point; during the descent the whole group
 * sits far below the ship and rises to meet it.
 */
export function Surface() {
  const phase = useStore((s) => s.phase);
  const site = useStore((s) => s.landingSite);
  const root = useRef<Group>(null);
  const dome = useRef<Mesh>(null);
  const [sim, setSim] = useState<RoverSim | null>(null);
  const terrain = useMemo(() => makeTerrain(site?.id ?? "jezero"), [site]);
  const geometry = useMemo(() => terrainGeometry(terrain), [terrain]);
  const mats = useMemo(
    () => ({
      dome: new ShaderMaterial({
        vertexShader: localVert,
        fragmentShader: skydomeFrag,
        uniforms: { uSunDir: local.sunDirUniform, uDaylight: local.daylight, uAir: local.air, ...MARS_SKY },
        side: BackSide,
        transparent: true,
        depthWrite: false,
      }),
      ground: new ShaderMaterial({
        vertexShader: localVert,
        fragmentShader: regolithFrag,
        uniforms: { uSunDir: local.sunDirUniform, uDaylight: local.daylight, ...groundUniforms },
      }),
    }),
    [],
  );

  const onSurface = phase === "surface";
  // The physics world only exists once landed; Rapier's WASM loads with it.
  useEffect(() => {
    if (!onSurface) return;
    let live = true;
    let made: RoverSim | null = null;
    createRoverSim(terrain, ROVER_START)
      .then((s) => {
        if (!live) return s.dispose();
        made = s;
        // Camera behind and above the rover once it exists.
        chase.reset = true;
        setSim(s);
      })
      .catch((e: unknown) => console.error("rover physics failed to load", e));
    return () => {
      live = false;
      made?.dispose();
      setSim(null);
    };
  }, [onSurface, terrain]);

  useFrame((state, delta) => {
    const camera = state.camera;
    const controls = state.controls as OrbitControlsImpl | null;
    const r = root.current;
    if (!r) return;
    groundUniforms.uSunColor.value.copy(local.sunColor);
    r.position.set(0, GROUND_Y - surface.altitudeKm * 1000, 0);
    if (dome.current) dome.current.position.copy(camera.position);

    if (!sim) return;
    sim.advance(delta, driveInput);
    const t = sim.body.translation();
    const q = sim.body.rotation();
    surface.rover.set(t.x, t.y, t.z);
    roverState.speed = sim.vehicle.currentVehicleSpeed();
    // Tilt: angle between the chassis up axis and local vertical.
    chassis.set(q.x, q.y, q.z, q.w);
    const up = upAxis.set(0, 1, 0).applyQuaternion(chassis);
    roverState.tiltDeg = (Math.acos(Math.min(Math.max(up.y, -1), 1)) * 180) / Math.PI;
    const fwd = fwdAxis.set(1, 0, 0).applyQuaternion(chassis);
    // Heading from north (-z), clockwise toward east (+x).
    roverState.headingDeg = ((Math.atan2(fwd.x, -fwd.z) * 180) / Math.PI + 360) % 360;
    roverState.sim = sim;

    // Nearest place of interest within reach.
    const places = [
      ...deepDives.map((d) => ({ id: d.id, ...d.at })),
      { id: "base", ...base.at },
      ...debris.map((d, i) => {
        const a = (i / Math.max(debris.length, 1)) * Math.PI * 2 + 0.4;
        return { id: `wreck:${d.id}`, x: Math.cos(a) * 160, z: Math.sin(a) * 160 };
      }),
    ];
    let nearest: { id: string; d: number } | null = null;
    for (const p of places) {
      const d = Math.hypot(p.x - t.x, p.z - t.z);
      if (!nearest || d < nearest.d) nearest = { id: p.id, d };
    }
    roverState.nearest = nearest;
    const target = nearest && nearest.d < OPEN_RANGE_M ? nearest.id : null;
    const store = useStore.getState();
    if (store.surfaceTarget !== target) store.setSurfaceTarget(target);

    // Chase camera: the orbit controls keep their angle while the target follows the rover.
    if (chase.reset) {
      chase.reset = false;
      last.set(0, 0, 0);
      camera.position.set(ROVER_START.x - 14, GROUND_Y + 7, ROVER_START.z + 10);
    }
    if (controls) {
      follow.set(t.x, t.y + GROUND_Y + 1, t.z);
      if (last.lengthSq() === 0) last.copy(follow);
      camera.position.add(follow).sub(last);
      controls.target.copy(follow);
      last.copy(follow);
    }
  });

  if (phase !== "descent" && phase !== "surface") return null;
  return (
    <>
      <mesh ref={dome} material={mats.dome} renderOrder={-10}>
        <sphereGeometry args={[30_000, 48, 24]} />
      </mesh>
      <group ref={root}>
        <mesh geometry={geometry} material={mats.ground} />
        <Rocks terrain={terrain} />
        <Base terrain={terrain} />
        <Beacons terrain={terrain} />
        <Wrecks terrain={terrain} />
        {onSurface && <RoverModel sim={sim} />}
      </group>
    </>
  );
}
