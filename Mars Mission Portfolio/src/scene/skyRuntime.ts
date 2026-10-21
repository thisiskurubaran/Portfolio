import { Matrix4, Vector3 } from "three";
import { sub, type Vec3 } from "@/physics/vec";
import { heliocentric, PLANETS, type PlanetId } from "@/space/elements";
import { earthBasis, eclipticToScene } from "@/space/frames";
import { daysSinceJ2000, gmst } from "@/space/time";

type Sighting = {
  /** Unit vector from the observer toward the body, scene axes. */
  dir: Vector3;
  /** Distance from the observer in AU. */
  distanceAu: number;
  /** Distance from the Sun in AU. */
  sunDistanceAu: number;
};

/**
 * Per frame sky state, shared by every scene object without going through
 * React. Updated once a frame by PhaseDriver before anything draws.
 *
 * Two viewpoints matter. Earth's own lighting and rotation always come from
 * Earth. What the crew sees (Sun direction, planets) comes from the
 * observer: Earth until departure, the ship once it is in interplanetary
 * space.
 */
export const sky = {
  simMs: Date.now(),
  /** Unit vector from Earth toward the Sun, scene axes. Lights Earth itself. */
  sunDir: new Vector3(1, 0, 0),
  /** Rotation of the Earth mesh: body fixed frame to scene. */
  earthRotation: new Matrix4(),
  /** Earth's north pole, scene axes. */
  earthPole: new Vector3(0, 1, 0),
  /** Heliocentric positions this frame, AU, ecliptic axes. */
  helio: Object.fromEntries(PLANETS.map((id) => [id, [0, 0, 0]])) as Record<PlanetId, Vec3>,
  /** The body the observer stands on, if any; it is not drawn as a point of light. */
  observerBody: "earth" as PlanetId | null,
  view: {
    /** Unit vector from the observer toward the Sun, scene axes. */
    sunDir: new Vector3(1, 0, 0),
    sunDistanceAu: 1,
  },
  planets: Object.fromEntries(
    PLANETS.map((id) => [id, { dir: new Vector3(), distanceAu: 0, sunDistanceAu: 0 }]),
  ) as Record<PlanetId, Sighting>,
};

const bx = new Vector3();
const bz = new Vector3();

export function updateSky(simMs: number): void {
  sky.simMs = simMs;
  for (const id of PLANETS) sky.helio[id] = heliocentric(id, simMs).r;
  const earth = sky.helio.earth;
  sky.sunDir.fromArray(eclipticToScene([-earth[0], -earth[1], -earth[2]])).normalize();

  const b = earthBasis(gmst(simMs), daysSinceJ2000(simMs) / 36525);
  sky.earthPole.fromArray(b.y);
  sky.earthRotation.makeBasis(bx.fromArray(b.x), sky.earthPole, bz.fromArray(b.z));
  updateView(earth, "earth");
}

/** Recomputes what the observer sees, from a heliocentric position in AU. */
export function updateView(observerAu: Vec3, body: PlanetId | null): void {
  sky.observerBody = body;
  const d = Math.hypot(...observerAu);
  sky.view.sunDir.fromArray(eclipticToScene([-observerAu[0], -observerAu[1], -observerAu[2]])).divideScalar(d);
  sky.view.sunDistanceAu = d;
  for (const id of PLANETS) {
    const helio = sky.helio[id];
    const rel = sub(helio, observerAu);
    const dist = Math.hypot(...rel);
    const s = sky.planets[id];
    s.dir.fromArray(eclipticToScene(rel)).divideScalar(dist || 1);
    s.distanceAu = dist;
    s.sunDistanceAu = Math.hypot(...helio);
  }
}
