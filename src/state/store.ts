import { create } from "zustand";

type SceneState = {
  /** 0 is flat calm, 1 is hurricane. Every sea and weather effect reads from this. */
  seaState: number;
  setSeaState: (value: number) => void;
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export const useSceneStore = create<SceneState>()((set) => ({
  seaState: 0.25,
  setSeaState: (value) => set({ seaState: clamp01(value) }),
}));
