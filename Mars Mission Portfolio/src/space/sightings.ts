import { GM_SUN } from "@/physics/constants";
import { type State, stateFromElements } from "@/physics/kepler";
import { toRad } from "./time";

/**
 * Comet 2P/Encke, the shortest period bright comet: elements as listed by
 * JPL's Small-Body Database for the 2023 apparition (perihelion 22 October
 * 2023). Non-gravitational forces from outgassing shift it by a few hours
 * an orbit, far below what the sky view can show.
 */
const ENCKE = {
  a: 2.215,
  e: 0.8483,
  i: toRad(11.78),
  Omega: toRad(334.57),
  argPeri: toRad(186.54),
  perihelionMs: Date.UTC(2023, 9, 22, 17),
};
const ENCKE_PERIOD_DAYS = 365.25 * Math.pow(ENCKE.a, 1.5);

export function enckeState(ms: number): State {
  const days = (ms - ENCKE.perihelionMs) / 86_400_000;
  const M = (2 * Math.PI * days) / ENCKE_PERIOD_DAYS;
  const varpi = ENCKE.Omega + ENCKE.argPeri;
  return stateFromElements({ a: ENCKE.a, e: ENCKE.e, i: ENCKE.i, Omega: ENCKE.Omega, varpi, L: varpi + M }, GM_SUN);
}

export const ENCKE_FACTS = {
  name: "Comet 2P/Encke",
  periodYears: ENCKE_PERIOD_DAYS / 365.25,
  perihelionAu: ENCKE.a * (1 - ENCKE.e),
};

/**
 * The two Voyagers, leaving the solar system. Directions (J2000) and
 * distances are rounded from NASA JPL's mission status for 2026; both
 * move about 3 to 3.6 AU a year, so the figures drift slowly.
 */
export const VOYAGERS = [
  {
    id: "voyager1",
    name: "Voyager 1",
    raDeg: 258.3,
    decDeg: 12.1,
    au: 171,
    launched: "5 September 1977",
    note: "Crossed into interstellar space in August 2012, the first spacecraft to do so.",
  },
  {
    id: "voyager2",
    name: "Voyager 2",
    raDeg: 301.9,
    decDeg: -58.9,
    au: 143,
    launched: "20 August 1977",
    note: "The only spacecraft to have flown past Uranus and Neptune. Reached interstellar space in November 2018.",
  },
] as const;

export const GOLDEN_RECORD =
  "Each carries a gold-plated copper record: greetings in 55 languages, music, natural sounds and 115 images, with a diagram on its cover showing how to play it and where the Sun is among 14 pulsars.";
