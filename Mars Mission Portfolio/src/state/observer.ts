import type { Vec3 } from "@/physics/vec";

/**
 * Where the crew is, heliocentric AU, once the ship has left Earth; null
 * while it is still at Earth. Kept free of three.js so the clock, which is
 * in the first page load, can read it.
 */
export const observer: { au: Vec3 | null } = { au: null };
