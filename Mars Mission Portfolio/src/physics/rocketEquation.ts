/** Standard gravity, m/s^2, used to turn specific impulse into exhaust velocity. */
export const G0 = 9.80665;

/** Propellant needed for a burn, kg (Tsiolkovsky). */
export function propellantFor(dvKmS: number, wetMassKg: number, ispS: number): number {
  const ve = (ispS * G0) / 1000;
  return wetMassKg * (1 - Math.exp(-dvKmS / ve));
}

/** Delta-v available from the propellant on board, km/s. */
export function deltaV(wetMassKg: number, dryMassKg: number, ispS: number): number {
  return ((ispS * G0) / 1000) * Math.log(wetMassKg / dryMassKg);
}
