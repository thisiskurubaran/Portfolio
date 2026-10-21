/**
 * Scene scale for the Earth shell (phase 1 and 2 views).
 *
 * One scene unit is one Earth radius. Bodies keep their real sizes relative
 * to Earth. The Sun sits closer than it really is (true distance is about
 * 23,500 units) so it fits inside the camera's far plane; its radius is
 * shrunk by the same factor so it keeps its real 0.53 degree apparent size.
 */
export const EARTH_RADIUS_KM = 6371;
export const SUN_RADIUS_KM = 695_700;
export const AU_KM = 149_597_870.7;

export const SUN_SCENE_DISTANCE = 2000;
/**
 * Planets are points of light at their real directions. They sit in front
 * of the Sun's shell so a transit of Mercury or Venus draws on top of the
 * disc, as it does in the real sky.
 */
export const PLANET_SCENE_DISTANCE = 1500;
export const STAR_SPHERE_RADIUS = 4000;

/** Sun radius in scene units for a given Earth to Sun distance in AU. */
export function sunSceneRadius(rAu: number): number {
  return (SUN_SCENE_DISTANCE * SUN_RADIUS_KM) / (rAu * AU_KM);
}

export const CLOUD_RADIUS = 1.006;
export const ATMOSPHERE_RADIUS = 1.025;
