import { DoubleSide, ShaderMaterial } from "three";
import vertexShader from "@/shaders/ship.vert";
import fragmentShader from "@/shaders/ship.frag";
import { BEAM, beamRuntime } from "../beamState";
import { envRuntime } from "../envRuntime";

let material: ShaderMaterial | null = null;
let underwater: ShaderMaterial | null = null;

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

/**
 * F17: the same look for wrecks and the seabed, but the beam is not cut off
 * at the surface. Clear water lets it reach down to them.
 */
export function wreckMaterial(): ShaderMaterial {
  if (!underwater) {
    underwater = shipMaterial().clone();
    // clone() copies uniforms; relink the shared ones and lift the cut-off.
    const u = underwater.uniforms;
    u.uLightDir = envRuntime.lightDir;
    u.uDaylight = envRuntime.daylight;
    u.uFlash = envRuntime.flash;
    u.uBeamOrigin = { value: beamRuntime.origin };
    u.uBeamDir = { value: beamRuntime.dir };
    u.uBeamCos = { value: Math.cos(BEAM.halfAngle * 2.5) };
    u.uBeamIntensity = beamRuntime.intensity;
    u.uBeamHitAlong = { value: 50 };
    u.uFogColor = envRuntime.horizon;
    u.uFogNear = envRuntime.fogNear;
    u.uFogFar = envRuntime.fogFar;
  }
  return underwater;
}
