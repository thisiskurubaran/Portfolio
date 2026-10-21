import { z } from "zod";

// Links from the feeds become links on the page, so only official hosts pass.
const HOSTS = ["kauai.ccmc.gsfc.nasa.gov", "webtools.ccmc.gsfc.nasa.gov", "www.swpc.noaa.gov"];
const link = z
  .string()
  .max(300)
  .url()
  .refine((u) => {
    const url = new URL(u);
    return url.protocol === "https:" && HOSTS.includes(url.hostname);
  });

export const spaceWeatherSchema = z.object({
  /** Planetary K index, 0 to 9, and when it was measured. */
  kp: z.number().min(0).max(9).nullable(),
  kpAt: z.string().max(40).nullable(),
  /** Strongest X-ray flare in the latest GOES list, e.g. "M2.4". */
  flare: z
    .object({ cls: z.string().regex(/^[ABCMX]\d+(\.\d+)?$/), at: z.string().max(40) })
    .nullable(),
  /** Integral proton flux at 10 MeV and above, pfu. */
  protons: z.number().min(0).max(1e6).nullable(),
  /** Earth-directed or not, recent CMEs from DONKI. */
  cmes: z
    .array(z.object({ id: z.string().max(64), at: z.string().max(40), speed: z.number().min(0).max(5000).nullable(), link }))
    .max(10),
  source: z.enum(["live", "fallback"]),
});

export type SpaceWeather = z.infer<typeof spaceWeatherSchema>;

/** NOAA G scale from Kp: G1 at Kp 5 up to G5 at Kp 9. */
export function gScale(kp: number | null): number {
  return kp === null ? 0 : Math.max(0, Math.min(5, Math.floor(kp) - 4));
}

/** NOAA S scale from proton flux: S1 at 10 pfu, each step ten times more. */
export function sScale(pfu: number | null): number {
  return pfu === null || pfu < 10 ? 0 : Math.min(5, Math.floor(Math.log10(pfu)));
}

/** NOAA R scale from flare class: R1 at M1, R3 at X1, R5 at X20. */
export function rScale(cls: string | null): number {
  if (!cls) return 0;
  const n = Number(cls.slice(1));
  if (cls[0] === "M") return n >= 5 ? 2 : 1;
  if (cls[0] === "X") return n >= 20 ? 5 : n >= 10 ? 4 : 3;
  return 0;
}

/** Ranks flare classes for comparison: each letter is ten times the one before. */
export function flareFlux(cls: string): number {
  const base = { A: 1e-8, B: 1e-7, C: 1e-6, M: 1e-5, X: 1e-4 }[cls[0] as "A"] ?? 0;
  return base * Number(cls.slice(1));
}

/**
 * Equatorward edge of the auroral oval, geomagnetic latitude in degrees.
 * A common rule of thumb from the NOAA aurora dashboard: about 66 degrees
 * at Kp 0, moving about 2.5 degrees closer to the equator per Kp step.
 */
export function auroraEdgeDeg(kp: number): number {
  return 66 - 2.5 * kp;
}
