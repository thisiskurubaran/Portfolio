import { Vector3 } from "three";

export type ShipState = {
  /** World point the label hangs from, just above the ship. */
  anchor: Vector3;
  /** Hull length in metres, used to frame the ship when it is opened. */
  length: number;
  /** Heading in radians; the bow points along (-sin, -cos). */
  heading: number;
  /** Height the beam aims at when this is focused: the sea surface, or the seabed for wrecks. */
  aimY: number;
  /** 0 hidden, 1 fully shown. Rises fast in the beam, fades slowly after. */
  reveal: number;
  /** Screen position in CSS pixels, written after the camera moves. */
  sx: number;
  sy: number;
  onScreen: boolean;
};

/** Per ship state shared by the scene and the DOM label layer, keyed by entry id. */
export const shipRuntime = new Map<string, ShipState>();

export function shipState(id: string): ShipState {
  let s = shipRuntime.get(id);
  if (!s) {
    s = { anchor: new Vector3(), length: 6, heading: 0, aimY: 0, reveal: 0, sx: 0, sy: 0, onScreen: false };
    shipRuntime.set(id, s);
  }
  return s;
}
