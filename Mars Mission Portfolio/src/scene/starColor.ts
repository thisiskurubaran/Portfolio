/** Effective temperature in kelvin from B-V colour index (Ballesteros 2012). */
export function bvToKelvin(bv: number): number {
  return 4600 * (1 / (0.92 * bv + 1.7) + 1 / (0.92 * bv + 0.62));
}

/**
 * Approximate blackbody colour of a temperature as linear RGB in 0..1,
 * normalised so the brightest channel is 1. Fit from Tanner Helland's
 * curves, which are accurate to a few percent over 1000 to 40000 K.
 */
export function kelvinToRgb(kelvin: number): [number, number, number] {
  const t = kelvin / 100;
  const r = t <= 66 ? 255 : 329.698727446 * Math.pow(t - 60, -0.1332047592);
  const g =
    t <= 66
      ? 99.4708025861 * Math.log(t) - 161.1195681661
      : 288.1221695283 * Math.pow(t - 60, -0.0755148492);
  const b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  const srgb = [r, g, b].map((c) => Math.min(Math.max(c, 0), 255) / 255);
  const linear = srgb.map((c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  const max = Math.max(...linear);
  return [linear[0]! / max, linear[1]! / max, linear[2]! / max];
}
