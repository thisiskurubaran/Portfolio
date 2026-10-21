import { Color, Quaternion, Vector3 } from "three";
import { useStore } from "@/state/store";
import { inMarsShadow } from "./marsRuntime";
import { ascent, frame, inEarthShadow } from "./missionRuntime";
import { sky } from "./skyRuntime";

/**
 * Lighting state for the local (metres) layer, derived from the sky layer
 * each frame. Uniform objects are shared by reference with the shaders.
 */
export const local = {
  sunDir: new Vector3(0, 1, 0),
  /** 1 in full daylight, 0 after civil twilight, or in Earth's shadow. */
  daylight: { value: 1 },
  /** Air density relative to sea level at the spacecraft's height. */
  air: { value: 1 },
  /** Height above the launch site ground, metres. */
  altitudeM: 0,
  /** Ground distance travelled east, metres. */
  downrangeM: 0,
  sunColor: new Color(1, 1, 1),
  /** Sunlight relative to its strength at 1 AU. */
  sunStrength: 1,
  /** How much sunlit planet fills the view below, 0 to 1. */
  earthshine: 0,
  /** Colour of the planet below, for the light it reflects up. */
  shineColor: new Color(0.32, 0.42, 0.58),
  /** Main engine firing outside the launch, for the plume. */
  engineBurn: false,
  sunDirUniform: { value: new Vector3(0, 1, 0) },
};

// Density scale height of the lower atmosphere, km.
const SCALE_HEIGHT_KM = 7.5;
const inverse = new Quaternion();
const noon = new Color(1, 0.97, 0.93);
const dusk = new Color(1, 0.55, 0.25);
// Sunlit Earth reflects about 30% of light, mostly blue and white; Mars about 25%, ochre.
const earthShine = new Color(0.32, 0.42, 0.58);
const marsShine = new Color(0.5, 0.3, 0.18);

export function updateLocal(): void {
  inverse.copy(frame.rotation).invert();
  local.sunDir.copy(sky.view.sunDir).applyQuaternion(inverse);
  local.sunDirUniform.value.copy(local.sunDir);

  const phase = useStore.getState().phase;
  const onAscent = phase === "ascent";
  const onGround = phase === "pad" || phase === "countdown";
  const altKm = onAscent ? ascent.sample.altitudeKm : onGround ? 0 : 1e4;
  local.altitudeM = altKm * 1000;
  local.downrangeM = onAscent ? ascent.sample.downrangeKm * 1000 : 0;
  local.air.value = Math.exp(-altKm / SCALE_HEIGHT_KM);

  const elevation = local.sunDir.y;
  if (local.air.value > 0.01) {
    // Inside the atmosphere: sunlight fades through twilight and reddens near the horizon.
    local.daylight.value = smoothstep(-0.1, 0.05, elevation);
    local.sunColor.copy(dusk).lerp(noon, smoothstep(0.0, 0.35, elevation));
  } else {
    const nearEarth = phase === "orbit" || phase === "tmi" || onAscent;
    const nearMars = phase === "capture" || phase === "marsOrbit";
    local.daylight.value = (nearEarth && inEarthShadow()) || (nearMars && inMarsShadow()) ? 0 : 1;
    local.sunColor.copy(noon);
  }
  // Sunlight thins with the square of distance from the Sun.
  local.sunStrength = 1 / (sky.view.sunDistanceAu * sky.view.sunDistanceAu);
  local.earthshine = phase === "transit" ? 0 : smoothstep(-0.35, 0.5, local.sunDir.y);
  local.shineColor.copy(phase === "capture" || phase === "marsOrbit" ? marsShine : earthShine);
}

export function smoothstep(a: number, b: number, x: number): number {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
}
