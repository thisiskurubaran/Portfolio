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

// Flux scale: magnitude 0 maps to this linear brightness. Sirius (-1.46)
// lands near 4, enough to bloom slightly; magnitude 6 stars stay faint.
const FLUX_AT_MAG0 = 1.1;
const FAINT_FLOOR = 0.12;
// Venus at -4.6 would otherwise reach about 75 and bloom over half the sky.
const MAX_FLUX = 8;

/** Linear HDR brightness for a point of light of the given visual magnitude. */
export function magToFlux(mag: number): number {
  return Math.min(FAINT_FLOOR + FLUX_AT_MAG0 * Math.pow(10, -0.4 * mag), MAX_FLUX);
}

/** Point size in CSS pixels; brighter points spread wider, as on a real sensor. */
export function magToSize(mag: number): number {
  return Math.min(Math.max(1.5 + (6 - mag) * 0.55, 1.5), 7);
}
