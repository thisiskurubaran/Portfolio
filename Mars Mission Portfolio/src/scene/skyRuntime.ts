import { Matrix4, Vector3 } from "three";
import { sub } from "@/physics/vec";
import { heliocentric, PLANETS, type PlanetId } from "@/space/elements";
import { earthBasis, eclipticToScene } from "@/space/frames";
import { daysSinceJ2000, gmst } from "@/space/time";

export type OtherPlanet = Exclude<PlanetId, "earth">;
export const OTHER_PLANETS = PLANETS.filter((p): p is OtherPlanet => p !== "earth");

type Sighting = {
  /** Unit vector from Earth toward the body, scene space. */
  dir: Vector3;
  /** Distance from Earth in AU. */
  distanceAu: number;
  /** Distance from the Sun in AU. */
  sunDistanceAu: number;
};

/**
 * Per frame sky state, shared by every scene object without going through
 * React. Updated once a frame by SkyClock before anything draws.
 */
export const sky = {
  simMs: Date.now(),
  /** Unit vector from Earth toward the Sun, scene space. */
  sunDir: new Vector3(1, 0, 0),
  /** Earth to Sun distance in AU. */
  sunDistanceAu: 1,
  /** Rotation of the Earth mesh: body fixed frame to scene. */
  earthRotation: new Matrix4(),
  /** Earth's north pole, scene space. */
  earthPole: new Vector3(0, 1, 0),
  planets: Object.fromEntries(
    OTHER_PLANETS.map((id) => [id, { dir: new Vector3(), distanceAu: 0, sunDistanceAu: 0 }]),
  ) as Record<OtherPlanet, Sighting>,
};

const bx = new Vector3();
const bz = new Vector3();

export function updateSky(simMs: number): void {
  sky.simMs = simMs;
  const earth = heliocentric("earth", simMs).r;
  const earthDist = Math.hypot(...earth);
  sky.sunDir.fromArray(eclipticToScene([-earth[0], -earth[1], -earth[2]])).divideScalar(earthDist);
  sky.sunDistanceAu = earthDist;

  for (const id of OTHER_PLANETS) {
    const helio = heliocentric(id, simMs).r;
    const geo = sub(helio, earth);
    const d = Math.hypot(...geo);
    const s = sky.planets[id];
    s.dir.fromArray(eclipticToScene(geo)).divideScalar(d);
    s.distanceAu = d;
    s.sunDistanceAu = Math.hypot(...helio);
  }

  const b = earthBasis(gmst(simMs), daysSinceJ2000(simMs) / 36525);
  sky.earthPole.fromArray(b.y);
  sky.earthRotation.makeBasis(bx.fromArray(b.x), sky.earthPole, bz.fromArray(b.z));
}
