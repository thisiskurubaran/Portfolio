import { Color, ShaderMaterial, Vector3 } from "three";
import rockyVert from "@/shaders/rocky.vert";
import rockyFrag from "@/shaders/rocky.frag";

export type RockyLook = { light: string; dark: string; caps: boolean; haze: number };

export const MARS_LOOK: RockyLook = { light: "#c98a5e", dark: "#8e6248", caps: true, haze: 0.08 };
// Highlands and maria; the Moon has no air, so no haze.
export const MOON_LOOK: RockyLook = { light: "#8c8883", dark: "#5a5856", caps: false, haze: 0 };

/** Material plus its uniforms, which the owner updates each frame. */
export function rockyMaterial(look: RockyLook) {
  const uniforms = {
    uSunDir: { value: new Vector3(1, 0, 0) },
    uSunIntensity: { value: 1.6 },
    // The shader works in linear light; the colours above are sRGB.
    uLight: { value: new Color(look.light) },
    uDark: { value: new Color(look.dark) },
    uCaps: { value: look.caps ? 1 : 0 },
    uHaze: { value: look.haze },
  };
  return { uniforms, material: new ShaderMaterial({ vertexShader: rockyVert, fragmentShader: rockyFrag, uniforms }) };
}
