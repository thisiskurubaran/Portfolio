import type { Shell } from "./resolve";

export interface ShellInfo {
  id: Shell;
  name: string;
  device: string;
}

export const shells: ShellInfo[] = [
  { id: "phone", name: "folioPhone", device: "Phone" },
  { id: "pad", name: "folioPad", device: "Tablet" },
  { id: "desk", name: "folioDesk", device: "Desktop" },
  { id: "vision", name: "folioVision", device: "Spatial" },
];

// Shells that exist in this build.
export const builtShells: Shell[] = ["phone", "pad", "desk", "vision"];

export const availableShells = shells.filter((s) => builtShells.includes(s.id));
