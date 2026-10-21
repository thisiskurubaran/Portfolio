import { GM_SUN } from "@/physics/constants";
import { type Elements, type State, stateFromElements } from "@/physics/kepler";
import { daysSinceJ2000, toRad } from "./time";

export type PlanetId =
  | "mercury"
  | "venus"
  | "earth"
  | "mars"
  | "jupiter"
  | "saturn"
  | "uranus"
  | "neptune";

/**
 * JPL approximate Keplerian elements, Table 1 (Standish), valid 1800 to
 * 2050, relative to the mean ecliptic and equinox of J2000. Each row is
 * [value at J2000, rate per Julian century] for a (AU), e, I, L, varpi and
 * Omega (degrees). "earth" is the Earth-Moon barycentre, which sits within
 * 4,700 km of Earth's centre.
 * https://ssd.jpl.nasa.gov/planets/approx_pos.html
 */
type Row = [number, number];
type ElementTable = { a: Row; e: Row; I: Row; L: Row; varpi: Row; Omega: Row };

const TABLE: Record<PlanetId, ElementTable> = {
  mercury: {
    a: [0.38709927, 0.00000037],
    e: [0.20563593, 0.00001906],
    I: [7.00497902, -0.00594749],
    L: [252.2503235, 149472.67411175],
    varpi: [77.45779628, 0.16047689],
    Omega: [48.33076593, -0.12534081],
  },
  venus: {
    a: [0.72333566, 0.0000039],
    e: [0.00677672, -0.00004107],
    I: [3.39467605, -0.0007889],
    L: [181.9790995, 58517.81538729],
    varpi: [131.60246718, 0.00268329],
    Omega: [76.67984255, -0.27769418],
  },
  earth: {
    a: [1.00000261, 0.00000562],
    e: [0.01671123, -0.00004392],
    I: [-0.00001531, -0.01294668],
    L: [100.46457166, 35999.37244981],
    varpi: [102.93768193, 0.32327364],
    Omega: [0, 0],
  },
  mars: {
    a: [1.52371034, 0.00001847],
    e: [0.0933941, 0.00007882],
    I: [1.84969142, -0.00813131],
    L: [-4.55343205, 19140.30268499],
    varpi: [-23.94362959, 0.44441088],
    Omega: [49.55953891, -0.29257343],
  },
  jupiter: {
    a: [5.202887, -0.00011607],
    e: [0.04838624, -0.00013253],
    I: [1.30439695, -0.00183714],
    L: [34.39644051, 3034.74612775],
    varpi: [14.72847983, 0.21252668],
    Omega: [100.47390909, 0.20469106],
  },
  saturn: {
    a: [9.53667594, -0.0012506],
    e: [0.05386179, -0.00050991],
    I: [2.48599187, 0.00193609],
    L: [49.95424423, 1222.49362201],
    varpi: [92.59887831, -0.41897216],
    Omega: [113.66242448, -0.28867794],
  },
  uranus: {
    a: [19.18916464, -0.00196176],
    e: [0.04725744, -0.00004397],
    I: [0.77263783, -0.00242939],
    L: [313.23810451, 428.48202785],
    varpi: [170.9542763, 0.40805281],
    Omega: [74.01692503, 0.04240589],
  },
  neptune: {
    a: [30.06992276, 0.00026291],
    e: [0.00859048, 0.00005105],
    I: [1.77004347, 0.00035372],
    L: [-55.12002969, 218.45945325],
    varpi: [44.96476227, -0.32241464],
    Omega: [131.78422574, -0.00508664],
  },
};

export const PLANETS = Object.keys(TABLE) as PlanetId[];

export function elementsAt(id: PlanetId, ms: number): Elements {
  const t = TABLE[id];
  const T = daysSinceJ2000(ms) / 36525;
  const at = ([v, rate]: Row) => v + rate * T;
  return {
    a: at(t.a),
    e: at(t.e),
    i: toRad(at(t.I)),
    L: toRad(at(t.L)),
    varpi: toRad(at(t.varpi)),
    Omega: toRad(at(t.Omega)),
  };
}

/** Heliocentric position (AU) and velocity (AU/day) in the J2000 ecliptic frame. */
export function heliocentric(id: PlanetId, ms: number): State {
  return stateFromElements(elementsAt(id, ms), GM_SUN);
}
