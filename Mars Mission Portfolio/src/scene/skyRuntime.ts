import { Matrix4, Vector3 } from "three";
import { earthBasis, eclipticToScene, fromEclipticLon } from "@/space/frames";
import { sunPosition } from "@/space/sun";
import { gmst } from "@/space/time";

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
};

const bx = new Vector3();
const bz = new Vector3();

export function updateSky(simMs: number): void {
  sky.simMs = simMs;
  const sun = sunPosition(simMs);
  sky.sunDir.fromArray(eclipticToScene(fromEclipticLon(sun.lon)));
  sky.sunDistanceAu = sun.r;
  const b = earthBasis(gmst(simMs));
  sky.earthPole.fromArray(b.y);
  sky.earthRotation.makeBasis(bx.fromArray(b.x), sky.earthPole, bz.fromArray(b.z));
}
