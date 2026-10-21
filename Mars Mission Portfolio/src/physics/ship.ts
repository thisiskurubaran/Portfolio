/**
 * The crew ship's propulsion budget. A 70 t ship with 45 t of propellant
 * on a 450 s engine (hydrogen and oxygen, the best chemical engines fly
 * near this) carries about 4.5 km/s of delta-v: enough for trans-Mars
 * injection from low Earth orbit, with the rest for corrections. Capture at
 * Mars uses the atmosphere (aerocapture), as NASA's Mars studies plan.
 */
export const SHIP = {
  wetKg: 70_000,
  dryKg: 25_000,
  ispS: 450,
} as const;

export const PROPELLANT_KG = SHIP.wetKg - SHIP.dryKg;
