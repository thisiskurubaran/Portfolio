/**
 * Apparent visual magnitude from absolute magnitude and distances, without
 * a phase term. Phase dims Mercury and Venus by up to a few magnitudes near
 * inferior conjunction, but they sit in the Sun's glare then anyway.
 */
export function apparentMagnitude(absMag: number, sunDistanceAu: number, observerDistanceAu: number) {
  return absMag + 5 * Math.log10(sunDistanceAu * observerDistanceAu);
}
