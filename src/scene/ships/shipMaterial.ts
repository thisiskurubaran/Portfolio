import { DoubleSide, ShaderMaterial } from "three";
import vertexShader from "@/shaders/ship.vert";
import fragmentShader from "@/shaders/ship.frag";
import { BEAM, beamRuntime } from "../beamState";
import { envRuntime } from "../envRuntime";

let material: ShaderMaterial | null = null;

/**
 * One material for every hull, lit only by the beam at night. Built directly
 * so the shared uniforms stay linked (R3F's uniforms prop would copy them).
 */
export function shipMaterial(): ShaderMaterial {
  material ??= new ShaderMaterial({
    vertexShader,
    fragmentShader,
    vertexColors: true,
    side: DoubleSide,
    uniforms: {
      uLightDir: envRuntime.lightDir,
      uDaylight: envRuntime.daylight,
      uFlash: envRuntime.flash,
      uBeamOrigin: { value: beamRuntime.origin },
      uBeamDir: { value: beamRuntime.dir },
      // Wider than the drawn cone: a ship at the edge of the beam should still catch light.
      uBeamCos: { value: Math.cos(BEAM.halfAngle * 1.6) },
      uBeamIntensity: beamRuntime.intensity,
      uBeamHitAlong: beamRuntime.hitAlong,
      uBeamLength: { value: BEAM.length },
      uFogColor: envRuntime.horizon,
      uFogNear: envRuntime.fogNear,
      uFogFar: envRuntime.fogFar,
    },
  });
  return material;
}
