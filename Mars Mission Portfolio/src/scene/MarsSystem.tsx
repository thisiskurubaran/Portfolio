"use client";

import { useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  type Group,
  IcosahedronGeometry,
  Matrix4,
  type Mesh,
  Points,
  PointsMaterial,
  ShaderMaterial,
  SRGBColorSpace,
  type Texture,
  TextureLoader,
  Vector3,
} from "three";
import planetVert from "@/shaders/planet.vert";
import marsFrag from "@/shaders/mars.frag";
import { eclipticToScene } from "@/space/frames";
import { MARS_MOONS, MARS_RADIUS_KM, marsAxes, type MarsMoon } from "@/space/mars";
import { useStore } from "@/state/store";
import { mars, moonPositionKm } from "./marsRuntime";
import { rockyMaterial } from "./rockyMaterial";
import { sky } from "./skyRuntime";

const marsUniforms = {
  uDay: { value: null as unknown },
  uSunDir: { value: new Vector3() },
  uSunIntensity: { value: 1.6 },
};
const moonLook = rockyMaterial({ light: "#6b6058", dark: "#3d3530", caps: false, haze: 0 });
const pinGeometry = new BufferGeometry();
pinGeometry.setAttribute("position", new BufferAttribute(new Float32Array(3), 3));

function marsMaterial(day: Texture): ShaderMaterial {
  day.colorSpace = SRGBColorSpace;
  day.anisotropy = 8;
  marsUniforms.uDay.value = day;
  return new ShaderMaterial({ vertexShader: planetVert, fragmentShader: marsFrag, uniforms: marsUniforms });
}

/** A lumpy body: an icosphere pushed in and out by low frequency noise, then stretched to the real axes. */
function moonGeometry(seed: number): IcosahedronGeometry {
  const g = new IcosahedronGeometry(1, 5);
  const pos = g.getAttribute("position");
  const v = new Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const bump =
      0.08 * Math.sin(3.1 * v.x + seed) * Math.cos(2.7 * v.y - seed) +
      0.05 * Math.sin(5.3 * v.z + 2 * seed) +
      0.03 * Math.sin(9.1 * (v.x + v.y) + seed);
    v.multiplyScalar(1 + bump);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

const v = new Vector3();
const xb = new Vector3();
const yb = new Vector3();
const zb = new Vector3();
const basis = new Matrix4();

/** Mars, Phobos and Deimos, in the Mars centred sky layer (one unit is one Mars radius). */
export function MarsSystem() {
  const phase = useStore((s) => s.phase);
  const site = useStore((s) => s.landingSite);
  const globe = useRef<Group>(null);
  const moonRefs = useRef<Partial<Record<MarsMoon, Mesh | null>>>({});
  const day = useLoader(TextureLoader, "/textures/mars/day.jpg");

  const material = useMemo(() => marsMaterial(day), [day]);
  const geo = useMemo(() => ({ phobos: moonGeometry(1.3), deimos: moonGeometry(4.1) }), []);
  const pin = useMemo(
    () =>
      new Points(
        pinGeometry,
        new PointsMaterial({
          color: new Color(0.6, 2.4, 1.2),
          size: 9,
          sizeAttenuation: false,
          blending: AdditiveBlending,
          depthWrite: false,
          transparent: true,
        }),
      ),
    [],
  );

  useFrame(() => {
    const g = globe.current;
    if (!g) return;
    // Body frame: longitude 0 on local +x, north on +y, 90 E on -z, as for Earth.
    const ax = marsAxes(sky.simMs);
    xb.set(...eclipticToScene(ax.lon0));
    yb.set(...eclipticToScene(ax.pole));
    zb.set(...eclipticToScene(ax.lon90e)).negate();
    g.quaternion.setFromRotationMatrix(basis.makeBasis(xb, yb, zb));

    const m = sky.helio.mars;
    marsUniforms.uSunDir.value.set(...eclipticToScene([-m[0], -m[1], -m[2]])).normalize();
    marsUniforms.uSunIntensity.value = 1.6 / (m[0] ** 2 + m[1] ** 2 + m[2] ** 2);
    moonLook.uniforms.uSunDir.value.copy(marsUniforms.uSunDir.value);
    moonLook.uniforms.uSunIntensity.value = marsUniforms.uSunIntensity.value;

    for (const id of ["phobos", "deimos"] as const) {
      const mesh = moonRefs.current[id];
      if (!mesh || !mars.moons[id]) continue;
      mesh.position.set(...eclipticToScene(moonPositionKm(id, sky.simMs))).divideScalar(MARS_RADIUS_KM);
      const [a, b, c] = MARS_MOONS[id].sizeKm;
      mesh.scale.set(a / MARS_RADIUS_KM, b / MARS_RADIUS_KM, c / MARS_RADIUS_KM);
      // Both moons are tidally locked, long axis pointing at Mars.
      mesh.lookAt(v.set(0, 0, 0));
      mesh.rotateY(Math.PI / 2);
    }

    if (site) {
      const lat = (site.latDeg * Math.PI) / 180;
      const lon = (site.lonDeg * Math.PI) / 180;
      // Just above the surface so the marker is not buried in the sphere.
      const r = 1.003;
      pinGeometry.getAttribute("position").setXYZ(0, r * Math.cos(lat) * Math.cos(lon), r * Math.sin(lat), -r * Math.cos(lat) * Math.sin(lon));
      pinGeometry.getAttribute("position").needsUpdate = true;
    }
  });

  if (phase !== "capture" && phase !== "marsOrbit") return null;
  return (
    <>
      <group ref={globe}>
        <mesh material={material}>
          <sphereGeometry args={[1, 192, 96]} />
        </mesh>
        {site && <primitive object={pin} />}
      </group>
      {(["phobos", "deimos"] as const).map((id) => (
        <mesh
          key={id}
          geometry={geo[id]}
          material={moonLook.material}
          ref={(m) => {
            moonRefs.current[id] = m;
          }}
        />
      ))}
    </>
  );
}
