import { Color, Quaternion, Vector3 } from "three";
import { useStore } from "@/state/store";
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
  sunDirUniform: { value: new Vector3(0, 1, 0) },
};

// Density scale height of the lower atmosphere, km.
const SCALE_HEIGHT_KM = 7.5;
const inverse = new Quaternion();
const noon = new Color(1, 0.97, 0.93);
const dusk = new Color(1, 0.55, 0.25);

export function updateLocal(): void {
  inverse.copy(frame.rotation).invert();
  local.sunDir.copy(sky.sunDir).applyQuaternion(inverse);
  local.sunDirUniform.value.copy(local.sunDir);

  const phase = useStore.getState().phase;
  const onAscent = phase === "ascent";
  const altKm = onAscent ? ascent.sample.altitudeKm : phase === "orbit" ? 1e4 : 0;
  local.altitudeM = altKm * 1000;
  local.downrangeM = onAscent ? ascent.sample.downrangeKm * 1000 : 0;
  local.air.value = Math.exp(-altKm / SCALE_HEIGHT_KM);

  const elevation = local.sunDir.y;
  if (local.air.value > 0.01) {
    // Inside the atmosphere: sunlight fades through twilight and reddens near the horizon.
    local.daylight.value = smoothstep(-0.1, 0.05, elevation);
    local.sunColor.copy(dusk).lerp(noon, smoothstep(0.0, 0.35, elevation));
  } else {
    local.daylight.value = inEarthShadow() ? 0 : 1;
    local.sunColor.copy(noon);
  }
}

export function smoothstep(a: number, b: number, x: number): number {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
}
