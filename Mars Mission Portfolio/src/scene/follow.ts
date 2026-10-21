import { type Camera, Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

/**
 * Third person follow for whatever the visitor is controlling: the orbit
 * controls keep the visitor's chosen angle and distance while the target
 * moves, so dragging still turns the view.
 */
const last = new Vector3();
let primed = false;
let owner = "";

export function followTarget(
  camera: Camera,
  controls: OrbitControlsImpl | null,
  target: Vector3,
  who: string,
  start?: Vector3,
): void {
  if (!controls) return;
  if (!primed || owner !== who) {
    // A new subject: frame it from a fixed offset, then follow from there.
    if (start) camera.position.copy(target).add(start);
    last.copy(target);
    primed = true;
    owner = who;
  }
  camera.position.add(target).sub(last);
  controls.target.copy(target);
  last.copy(target);
}

/** Forget the subject, so the next follow re-frames it. */
export function resetFollow(): void {
  primed = false;
  owner = "";
}
