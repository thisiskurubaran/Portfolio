import { create } from "zustand";
import type { Conditions } from "@/weather/schema";

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

  /**
   * Last ship opened. Kept after the panel closes so the panel can animate
   * out with its content still in place.
   */
  selectedId: string | null;
  panelOpen: boolean;
  select: (id: string) => void;
  closePanel: () => void;

  /** Ship whose label has keyboard focus. The beam swings to it. */
  focusedId: string | null;
  focusShip: (id: string | null) => void;

  /** Location and weather from /api/conditions. Null until it answers, or if it fails. */
  conditions: Conditions | null;
  setConditions: (c: Conditions | null) => void;

  /** True while the sun is up and the visitor has not asked for night. */
  isDay: boolean;
  setIsDay: (v: boolean) => void;
  /** Visitor chose night during the day (F04 switch). */
  forceNight: boolean;
  setForceNight: (v: boolean) => void;

  /** Why the plain site is being suggested, if it is. */
  plainOffer: "no-webgl" | "slow" | null;
  offerPlain: (reason: "no-webgl" | "slow") => void;
  dismissPlainOffer: () => void;
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
  panelOpen: false,
  select: (id) => set({ selectedId: id, panelOpen: true }),
  closePanel: () => set({ panelOpen: false }),

  focusedId: null,
  focusShip: (id) => set({ focusedId: id }),

  conditions: null,
  setConditions: (conditions) => set({ conditions }),

  isDay: false,
  setIsDay: (isDay) => set({ isDay }),
  forceNight: false,
  setForceNight: (forceNight) => set({ forceNight }),

  plainOffer: null,
  // A missing WebGL context outranks a slow device, so it is never replaced.
  offerPlain: (reason) => set((s) => (s.plainOffer === "no-webgl" ? s : { plainOffer: reason })),
  dismissPlainOffer: () => set({ plainOffer: null }),
}));
