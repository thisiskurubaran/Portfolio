"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BoxGeometry, Group, IcosahedronGeometry, InstancedMesh, MeshBasicMaterial, Object3D, Vector3 } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { isHarborMode, useSceneStore } from "@/state/store";
import { isInBeam } from "./beamState";
import { bakeFlat, hash3 } from "./bake";
import { envRuntime } from "./envRuntime";
import { shipMaterial } from "./ships/shipMaterial";
import { shipState } from "./ships/shipRuntime";

const ROCKS = 22;
// Tops sit just under mid tide, so they break the surface only as it falls.
const TOP_Y = -0.3;
export const LOW_TIDE_ID = "low-tide";
const FIND = new Vector3(-7, TOP_Y - 0.05, -13.5);
const LINGER_S = 2.5;

const rockMaterial = new MeshBasicMaterial({ vertexColors: true });

function chestGeometry() {
  const body = new BoxGeometry(0.9, 0.55, 0.6);
  body.translate(0, 0.28, 0);
  const band = new BoxGeometry(0.94, 0.1, 0.64);
  band.translate(0, 0.42, 0);
  const paint = (g: BoxGeometry, hex: string) => {
    const baked = bakeFlat(g, hex, 1);
    // Ship material lights from its own normals, so give it fresh ones.
    baked.computeVertexNormals();
    return baked;
  };
  return mergeGeometries([paint(body, "#6b4a2e"), paint(band, "#c9a24a")])!;
}

/** F06: rocks around the island that show at low tide, and something wedged among them. */
export function TideRocks() {
  const instanced = useRef<InstancedMesh>(null);
  const chest = useRef<Group>(null);
  const lastSeen = useRef(-Infinity);

  const rock = useMemo(() => bakeFlat(new IcosahedronGeometry(1, 0), "#3a4038"), []);
  const chestGeo = useMemo(() => chestGeometry(), []);

  const placements = useMemo(() => {
    const out: { x: number; z: number; s: number; r: number }[] = [];
    for (let i = 0; i < ROCKS; i++) {
      // A loose ring outside the main rock, thicker on the seaward side.
      const a = Math.PI * (0.15 + 1.7 * hash3(i, 2.1, 0.4));
      const r = 11 + hash3(i, 8.3, 1.7) * 6;
      out.push({ x: Math.cos(a) * r, z: -Math.sin(a) * r, s: 0.6 + hash3(i, 4.4, 9.9) * 1.1, r: hash3(i, 1.2, 3.3) * 6 });
    }
    return out;
  }, []);

  useFrame(({ clock }) => {
    const mesh = instanced.current;
    if (mesh && mesh.userData.placed !== true) {
      const o = new Object3D();
      placements.forEach((p, i) => {
        o.position.set(p.x, TOP_Y - p.s * 0.9, p.z);
        o.scale.set(p.s * 1.3, p.s, p.s);
        o.rotation.set(p.r, p.r * 2, 0);
        o.updateMatrix();
        mesh.setMatrixAt(i, o.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      mesh.userData.placed = true;
    }
    rockMaterial.color.setScalar(1 + envRuntime.daylight.value * 1.8 + envRuntime.flash.value);

    // The find shows its label at low tide, once the beam (or daylight) is on it.
    const store = useSceneStore.getState();
    const state = shipState(LOW_TIDE_ID);
    state.length = 3;
    state.anchor.set(FIND.x, FIND.y + 1.4, FIND.z);
    const t = clock.elapsedTime;
    if (store.tide?.low && (isInBeam(FIND) || isHarborMode(store))) lastSeen.current = t;
    const target = store.tide?.low && t - lastSeen.current < LINGER_S ? 1 : 0;
    state.reveal += (target - state.reveal) * 0.08;
    if (chest.current) chest.current.position.copy(FIND);
  });

  return (
    <group>
      <instancedMesh ref={instanced} args={[rock, rockMaterial, ROCKS]} frustumCulled={false} />
      <group ref={chest} rotation={[0.15, 0.6, 0.1]}>
        <mesh geometry={chestGeo} material={shipMaterial()} />
      </group>
    </group>
  );
}
