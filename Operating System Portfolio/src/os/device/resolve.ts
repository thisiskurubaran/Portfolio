export type Shell = "phone" | "pad" | "desk" | "vision";

export interface DeviceSignals {
  width: number;
  coarsePointer: boolean;
  userAgent: string;
}

export const SHELL_STORAGE_KEY = "folioos.shell";

export function isShell(value: unknown): value is Shell {
  return value === "phone" || value === "pad" || value === "desk" || value === "vision";
}

// Phone width plus touch is folioPhone, tablet width plus touch is folioPad,
// everything else is folioDesk. folioVision is opt-in, never auto-picked.
export function resolveShell(signals: DeviceSignals, override?: Shell | null): Shell {
  if (override) return override;
  const { width, coarsePointer, userAgent } = signals;
  const mobileUa = /iphone|ipod|android.+mobile/i.test(userAgent);
  const tabletUa = /ipad|android(?!.*mobile)/i.test(userAgent);
  if (coarsePointer || mobileUa || tabletUa) {
    if (width < 700 || mobileUa) return "phone";
    if (width < 1200 || tabletUa) return "pad";
  }
  return "desk";
}
