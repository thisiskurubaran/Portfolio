"use client";

import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  BlendFunction,
  BloomEffect,
  EffectComposer,
  EffectPass,
  NoiseEffect,
  RenderPass,
  ToneMappingEffect,
  ToneMappingMode,
} from "postprocessing";
import { HalfFloatType, type PerspectiveCamera, Vector3 } from "three";
import { frame } from "./missionRuntime";
import { EARTH_RADIUS_KM } from "./scale";
import { skyCamera, skyScene } from "./skyLayer";

const offset = new Vector3();

/**
 * Renders the two layers into one HDR buffer: first the Earth centred sky
 * (Earth radii), then the local scene (metres) over it with only the depth
 * buffer cleared, then bloom, tone mapping and grain on the result. Keeping
 * the layers apart avoids depth precision trouble between a 10 m ship and a
 * planet thousands of km away.
 */
export function Renderer() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);

  const composer = useMemo(() => {
    const c = new EffectComposer(gl, { frameBufferType: HalfFloatType, multisampling: 4 });
    c.addPass(new RenderPass(skyScene, skyCamera));
    const local = new RenderPass(scene, camera);
    local.clearPass.setClearFlags(false, true, false);
    c.addPass(local);
    const grain = new NoiseEffect({ blendFunction: BlendFunction.SOFT_LIGHT });
    grain.blendMode.opacity.value = 0.025;
    c.addPass(
      new EffectPass(
        camera,
        new BloomEffect({ luminanceThreshold: 1, luminanceSmoothing: 0.2, intensity: 0.9, mipmapBlur: true }),
        new ToneMappingEffect({ mode: ToneMappingMode.AGX }),
        grain,
      ),
    );
    return c;
  }, [gl, scene, camera]);

  useEffect(() => () => composer.dispose(), [composer]);

  useEffect(() => {
    composer.setSize(size.width, size.height);
    skyCamera.aspect = size.width / size.height;
  }, [composer, size]);

  useFrame((_, delta) => {
    // The sky camera looks the same way as the local camera, from the same
    // point, expressed in the sky layer's frame and units.
    skyCamera.quaternion.copy(frame.rotation).multiply(camera.quaternion);
    offset.copy(camera.position).multiplyScalar(0.001).applyQuaternion(frame.rotation);
    skyCamera.position.copy(frame.originKm).add(offset).divideScalar(frame.skyScaleKm);
    skyCamera.fov = camera.fov;
    if (frame.skyScaleKm === EARTH_RADIUS_KM) {
      // Near plane scaled to the height above the ground, so a low camera can
      // still see Earth close up without starving the far depth range.
      const altitude = skyCamera.position.length() - 1;
      skyCamera.near = Math.min(Math.max(altitude * 0.3, 1e-4), 0.05);
    } else {
      skyCamera.near = frame.skyNear;
    }
    skyCamera.updateProjectionMatrix();
    skyCamera.updateMatrixWorld();
    composer.render(delta);
  }, 1);

  return null;
}
