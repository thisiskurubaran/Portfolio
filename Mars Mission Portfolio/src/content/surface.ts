/**
 * The surface leg. Deep dives are beacons on the terrain, each a theme
 * that cuts across roles: the panel lists every role and highlight where
 * the theme's skills were used, all from experience.ts. The base by the
 * lander holds the contact links.
 */
export type DeepDive = {
  id: string;
  name: string;
  /** Skills that mark a role as part of this theme, matched against experience.ts. */
  skills: readonly string[];
  /** Metres east and south of the landing point. */
  at: { x: number; z: number };
};

export const deepDives: readonly DeepDive[] = [
  {
    id: "spatial",
    name: "Spatial computing",
    skills: ["ARKit", "Spatial Computing", "Computer Vision"],
    at: { x: 95, z: -40 },
  },
  {
    id: "ai-ml",
    name: "AI and ML in production",
    skills: ["AI", "Machine Learning", "Computer Vision"],
    at: { x: -80, z: -85 },
  },
  {
    id: "geo",
    name: "Location without GPS",
    skills: ["Kalman filtering", "GPS", "GIS", "GeoServer", "OpenLayers"],
    at: { x: -110, z: 60 },
  },
  {
    id: "mobile",
    name: "Mobile at scale",
    skills: ["Flutter", "Firebase", "Cloud Firestore", "iOS Development", "SwiftUI"],
    at: { x: 60, z: 110 },
  },
];

export const base = {
  name: "Mars base",
  at: { x: -18, z: 14 },
};

/** How close the rover has to get for a beacon to open, metres. */
export const OPEN_RANGE_M = 14;
