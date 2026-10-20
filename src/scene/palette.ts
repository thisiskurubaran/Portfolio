import { Color, Vector3 } from "three";

// Shared by the sea shader, the sky and the baked island colors so the
// horizon, fog and water edge always meet without a visible seam.
export const NIGHT = {
  horizon: new Color("#0d1626"),
  zenith: new Color("#02040a"),
  seaDeep: new Color("#04101c"),
  seaCrest: new Color("#2a4a66"),
  moonLight: new Color("#c9d6ea"),
  fogNear: 40,
  fogFar: 260,
};

export const MOON_DIR = new Vector3(-0.22, 0.26, -0.94).normalize();
