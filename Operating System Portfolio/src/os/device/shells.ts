import type { Shell } from "./resolve";

export interface ShellInfo {
  id: Shell;
  name: string;
  device: string;
}

export const shells: ShellInfo[] = [
  { id: "phone", name: "kbPhone", device: "Phone" },
  { id: "pad", name: "kbPad", device: "Tablet" },
  { id: "desk", name: "kbDesk", device: "Desktop" },
  { id: "vision", name: "kbVision", device: "Spatial" },
];

// Shells that exist in this build. The rest resolve to kbDesk until they land.
export const builtShells: Shell[] = ["phone", "desk"];

export const availableShells = shells.filter((s) => builtShells.includes(s.id));
