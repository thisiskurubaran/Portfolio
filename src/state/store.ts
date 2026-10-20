import { create } from "zustand";

type SceneState = {
  /** 0 is flat calm, 1 is hurricane. Every sea and weather effect reads from this. */
  seaState: number;
  setSeaState: (value: number) => void;

  /** Where input wants the beam. The scene eases toward it each frame. */
  beamTarget: {
    /** Radians, positive turns left. */
    yaw: number;
    /** 0 points near the rock, 1 points at the horizon. */
    tilt: number;
  };
  setBeamTarget: (yaw: number, tilt: number) => void;
  nudgeBeam: (dYaw: number, dTilt: number) => void;

  /** Entry id of the open ship, or null when no panel is open. */
  selectedId: string | null;
  select: (id: string | null) => void;
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// Keeps the beam on the seaward side. Behind the tower is only rock.
export const BEAM_YAW_LIMIT = 1.4;
const clampYaw = (v: number) => Math.min(BEAM_YAW_LIMIT, Math.max(-BEAM_YAW_LIMIT, v));

export const useSceneStore = create<SceneState>()((set) => ({
  seaState: 0.25,
  setSeaState: (value) => set({ seaState: clamp01(value) }),

  beamTarget: { yaw: 0, tilt: 0.65 },
  setBeamTarget: (yaw, tilt) => set({ beamTarget: { yaw: clampYaw(yaw), tilt: clamp01(tilt) } }),
  nudgeBeam: (dYaw, dTilt) =>
    set((s) => ({
      beamTarget: { yaw: clampYaw(s.beamTarget.yaw + dYaw), tilt: clamp01(s.beamTarget.tilt + dTilt) },
    })),

  selectedId: null,
  select: (id) => set({ selectedId: id }),
}));
