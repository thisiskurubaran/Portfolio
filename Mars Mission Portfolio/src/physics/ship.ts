/**
 * The crew ship's propulsion budget. 110 t at departure with 80 t of
 * propellant on a 450 s engine (hydrogen and oxygen, the best chemical
 * engines fly near this) carries about 5.7 km/s of delta-v: roughly
 * 3.6 km/s for trans-Mars injection from low Earth orbit, and the rest for
 * the burns around Mars. Most of the capture at Mars is done by the
 * atmosphere (aerocapture), as NASA's Mars studies plan.
 */
export const SHIP = {
  wetKg: 110_000,
  dryKg: 30_000,
  ispS: 450,
} as const;

export const PROPELLANT_KG = SHIP.wetKg - SHIP.dryKg;
