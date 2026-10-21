/**
 * Physics runs in astronomical units and days. Those keep the numbers near 1
 * for anything between the Sun and Neptune, which keeps float error low.
 */
export const AU_KM = 149_597_870.7;
export const DAY_S = 86_400;
export const DAY_MS = 86_400_000;

/** Speed of light in km/s (exact by definition). */
export const C_KM_S = 299_792.458;

/** Sun's GM in AU^3/day^2: the square of the Gaussian gravitational constant. */
export const GM_SUN = 0.01720209895 ** 2;

/** Planet GM values in AU^3/day^2, from JPL DE440 (km^3/s^2) converted. */
const KM3S2_TO_AU3D2 = DAY_S ** 2 / AU_KM ** 3;
export const GM = {
  sun: GM_SUN,
  earth: 398_600.435507 * KM3S2_TO_AU3D2,
  moon: 4_902.800118 * KM3S2_TO_AU3D2,
  mars: 42_828.375816 * KM3S2_TO_AU3D2,
  jupiter: 126_712_764.1 * KM3S2_TO_AU3D2,
} as const;
