import type { VesselEntry } from "@/content/types";

export type Pose = { x: number; z: number; heading: number };

type Drift =
  | { fixed: true; pose: Pose }
  | { fixed: false; ax: number; az: number; rx: number; rz: number; period: number; phase: number };

// End of the jetty, on the side facing the camera.
const ROWBOAT_POSE: Pose = { x: 15, z: -2.3, heading: Math.PI / 2 };

const ARC = 1.15;
const DISTANCES = [52, 82, 64, 100, 58, 90, 72];

/**
 * Spreads ships across the seaward arc the beam can reach and gives each a
 * slow loop around its anchor. Positions are derived from list order so a
 * ship stays in the same part of the sea between visits.
 */
export function driftFor(entry: VesselEntry, index: number, total: number): Drift {
  if (entry.kind === "rowboat") return { fixed: true, pose: ROWBOAT_POSE };

  // Golden ratio steps spread any number of ships across the arc without
  // neighbours in the list ending up side by side.
  const spread = total > 1 ? (index * 0.618034) % 1 : 0.5;
  const yaw = -ARC + 2 * ARC * spread;
  const dist = DISTANCES[index % DISTANCES.length]!;
  const big = entry.kind === "cargo";
  return {
    fixed: false,
    ax: -Math.sin(yaw) * dist,
    az: -Math.cos(yaw) * dist,
    rx: big ? 10 : 6,
    rz: big ? 6 : 4,
    // Minutes per loop, so ships creep along rather than race.
    period: (big ? 300 : 200) + index * 23,
    phase: index * 1.7,
  };
}

export function poseAt(d: Drift, t: number, out: Pose): Pose {
  if (d.fixed) return Object.assign(out, d.pose);
  const a = d.phase + (t / d.period) * Math.PI * 2;
  out.x = d.ax + Math.cos(a) * d.rx;
  out.z = d.az + Math.sin(a) * d.rz;
  // Face along the loop. Bow is -Z, so heading h points along (-sin h, -cos h).
  const vx = -Math.sin(a) * d.rx;
  const vz = Math.cos(a) * d.rz;
  out.heading = Math.atan2(-vx, -vz);
  return out;
}
