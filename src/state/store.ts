import { create } from "zustand";
import type { Conditions } from "@/weather/schema";
import type { Hazards } from "@/weather/hazards";
import type { PresetId } from "@/weather/presets";
import type { Season } from "@/weather/season";

type SceneState = {
  /** 0 is flat calm, 1 is hurricane. Every sea and weather effect reads from this. */
  seaState: number;
  setSeaState: (value: number) => void;
  /** Visitor or developer choice that wins over the real weather. */
  seaOverride: number | null;
  setSeaOverride: (value: number | null) => void;

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

  /** Developer override for rain and snow intensity, 0 to 1. */
  precipOverride: { rain: number | null; snow: number | null };
  setPrecipOverride: (kind: "rain" | "snow", value: number | null) => void;

  /** Location and weather from /api/conditions. Null until it answers, or if it fails. */
  conditions: Conditions | null;
  setConditions: (c: Conditions | null) => void;

  /** F06: which way the tide is going and whether it is an estimate. Level lives in seaRuntime. */
  tide: { rising: boolean; estimated: boolean; low: boolean } | null;
  setTide: (t: { rising: boolean; estimated: boolean; low: boolean }) => void;
  /** Developer override for the tide level, -1 to 1. */
  tideOverride: number | null;
  setTideOverride: (v: number | null) => void;

  /** F05 and F34: live cyclones and recent quakes worldwide. */
  hazards: Hazards | null;
  setHazards: (h: Hazards | null) => void;

  /** F18: weather the visitor picked. Null follows the real weather. Not saved, so it resets on reload. */
  weatherPreset: PresetId | null;
  setWeatherPreset: (id: PresetId | null) => void;
  /** F03: a dangerous real storm is near, so the scene is being kept calm. */
  calmForRealStorm: boolean;
  setCalmForRealStorm: (v: boolean) => void;

  /** F03: most recent thunderclap, for the sound layer. Strength 0 to 1. */
  lastThunder: { at: number; strength: number } | null;
  thunder: (strength: number) => void;

  /** F09: where the boat in distress is in its story. Progress lives in rescueRuntime. */
  rescuePhase: "idle" | "distress" | "guiding" | "docked";
  setRescuePhase: (p: "idle" | "distress" | "guiding" | "docked") => void;

  /** F26: past midnight for the visitor, when the ghost ship sails. */
  ghostHour: boolean;
  setGhostHour: (v: boolean) => void;

  /** F11: from the date and hemisphere. */
  season: Season;
  setSeason: (s: Season) => void;

  /** True while the sun is up at the visitor's location, whatever they chose. */
  sunUp: boolean;
  setSunUp: (v: boolean) => void;
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
  seaOverride: null,
  setSeaOverride: (value) => set({ seaOverride: value === null ? null : clamp01(value) }),

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

  precipOverride: { rain: null, snow: null },
  setPrecipOverride: (kind, value) =>
    set((s) => ({ precipOverride: { ...s.precipOverride, [kind]: value === null ? null : clamp01(value) } })),

  conditions: null,
  setConditions: (conditions) => set({ conditions }),

  tide: null,
  setTide: (tide) =>
    set((s) =>
      s.tide && s.tide.rising === tide.rising && s.tide.estimated === tide.estimated && s.tide.low === tide.low
        ? s
        : { tide },
    ),
  tideOverride: null,
  setTideOverride: (tideOverride) => set({ tideOverride }),

  hazards: null,
  setHazards: (hazards) => set({ hazards }),

  weatherPreset: null,
  setWeatherPreset: (weatherPreset) => set({ weatherPreset }),
  calmForRealStorm: false,
  setCalmForRealStorm: (calmForRealStorm) => set({ calmForRealStorm }),

  lastThunder: null,
  thunder: (strength) => set({ lastThunder: { at: performance.now(), strength } }),

  rescuePhase: "idle",
  setRescuePhase: (rescuePhase) => set({ rescuePhase }),

  ghostHour: false,
  setGhostHour: (ghostHour) => set({ ghostHour }),

  season: "autumn",
  setSeason: (season) => set({ season }),

  sunUp: false,
  setSunUp: (sunUp) => set({ sunUp }),
  forceNight: false,
  setForceNight: (forceNight) => set({ forceNight }),

  plainOffer: null,
  // A missing WebGL context outranks a slow device, so it is never replaced.
  offerPlain: (reason) => set((s) => (s.plainOffer === "no-webgl" ? s : { plainOffer: reason })),
  dismissPlainOffer: () => set({ plainOffer: null }),
}));

/** Harbor mode (F04): daytime, unless the visitor switched to night. */
export const isHarborMode = (s: Pick<SceneState, "sunUp" | "forceNight">) => s.sunUp && !s.forceNight;
