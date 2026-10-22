import { create } from "zustand";

// F35: set when the frame rate or the connection says the device is
// struggling. Blur and heavy animation switch off and folioVision is skipped.
interface PowerStore {
  lowPower: boolean;
  reason: string | null;
  setLowPower: (lowPower: boolean, reason?: string | null) => void;
}

export const usePower = create<PowerStore>((set) => ({
  lowPower: false,
  reason: null,
  setLowPower: (lowPower, reason = null) => set({ lowPower, reason: lowPower ? reason : null }),
}));
