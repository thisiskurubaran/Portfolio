import { z } from "zod";

/** CelesTrak's OMM JSON, the fields this needs. */
export const ommSchema = z.object({
  OBJECT_NAME: z.string().max(40),
  OBJECT_ID: z.string().max(20),
  EPOCH: z.string().max(40),
  MEAN_MOTION: z.number().min(0.5).max(20),
  ECCENTRICITY: z.number().min(0).max(0.99),
  INCLINATION: z.number().min(0).max(180),
  RA_OF_ASC_NODE: z.number().min(0).max(360),
  ARG_OF_PERICENTER: z.number().min(0).max(360),
  MEAN_ANOMALY: z.number().min(0).max(360),
});
export type Omm = z.infer<typeof ommSchema>;

export const satellitesSchema = z.object({
  iss: ommSchema.nullable(),
  /** The newest Starlink launch still flying in a tight line, if any. */
  train: z.array(ommSchema).max(60),
  source: z.enum(["celestrak", "fallback"]),
});
export type Satellites = z.infer<typeof satellitesSchema>;

const MU = 398_600.4418;
const RE = 6378.137;
const J2 = 1.08262668e-3;
const D = Math.PI / 180;

/**
 * Position in km, Earth centred, in the equator and equinox of date (near
 * enough to TEME for a picture). Two-body motion plus the secular drift of
 * node and perigee from Earth's oblateness (J2). Not SGP4: it ignores drag
 * and short period terms, so it drifts by tens of km a day from the epoch,
 * fine for showing a pass but not for pointing a telescope.
 */
export function satPositionKm(o: Omm, ms: number): [number, number, number] {
  const n = (o.MEAN_MOTION * 2 * Math.PI) / 86_400;
  const a = Math.cbrt(MU / (n * n));
  const e = o.ECCENTRICITY;
  const i = o.INCLINATION * D;
  const p = a * (1 - e * e);
  const k = 1.5 * J2 * (RE / p) ** 2 * n;
  const dt = (ms - Date.parse(o.EPOCH.endsWith("Z") ? o.EPOCH : `${o.EPOCH}Z`)) / 1000;
  const node = o.RA_OF_ASC_NODE * D - k * Math.cos(i) * dt;
  const peri = o.ARG_OF_PERICENTER * D + k * (2 - 2.5 * Math.sin(i) ** 2) * dt;
  const M = o.MEAN_ANOMALY * D + n * dt;
  let E = M;
  for (let it = 0; it < 8; it++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  const nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
  const r = a * (1 - e * Math.cos(E));
  const u = peri + nu;
  const x = r * (Math.cos(node) * Math.cos(u) - Math.sin(node) * Math.sin(u) * Math.cos(i));
  const y = r * (Math.sin(node) * Math.cos(u) + Math.cos(node) * Math.sin(u) * Math.cos(i));
  const z = r * Math.sin(u) * Math.sin(i);
  return [x, y, z];
}
