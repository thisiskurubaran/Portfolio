import { Color, PerspectiveCamera, Scene } from "three";

/**
 * The Earth centred sky layer (units: Earth radii). Module level so the
 * renderer and the portal share one instance; this module only loads on the
 * client, inside the dynamically imported scene.
 */
export const skyScene = new Scene();
skyScene.background = new Color(0x000000);

export const skyCamera = new PerspectiveCamera(45, 1, 0.05, 10_000);
