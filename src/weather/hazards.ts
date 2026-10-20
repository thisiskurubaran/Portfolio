import { z } from "zod";

// Links from the feeds end up as links on the page, so only official hosts pass.
const ADVISORY_HOSTS = ["www.gdacs.org", "gdacs.org", "www.nhc.noaa.gov", "nhc.noaa.gov"];
const advisoryUrl = z
  .string()
  .max(300)
  .url()
  .refine((u) => {
    const url = new URL(u);
    return url.protocol === "https:" && ADVISORY_HOSTS.includes(url.hostname);
  });

const lat = z.number().min(-90).max(90);
const lon = z.number().min(-180).max(180);

export const hazardStorm = z.object({
  id: z.string().max(64),
  name: z.string().max(80),
  /** Human readable strength, as the source words it. */
  category: z.string().max(120),
  lat,
  lon,
  windKmh: z.number().min(0).max(500).nullable(),
  source: z.enum(["GDACS", "NHC"]),
  url: advisoryUrl,
});

export const hazardQuake = z.object({
  id: z.string().max(64),
  name: z.string().max(120),
  magnitude: z.number().min(0).max(10),
  lat,
  lon,
  alert: z.enum(["Green", "Orange", "Red"]),
  /** ISO time of the quake. */
  at: z.string().max(40),
  url: advisoryUrl,
});

export const hazardsSchema = z.object({
  storms: z.array(hazardStorm).max(40),
  quakes: z.array(hazardQuake).max(40),
});

export type HazardStorm = z.infer<typeof hazardStorm>;
export type HazardQuake = z.infer<typeof hazardQuake>;
export type Hazards = z.infer<typeof hazardsSchema>;

const R = 6371;
const rad = (d: number) => (d * Math.PI) / 180;

/** Great circle distance in km. */
export function distanceKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const dLat = rad(bLat - aLat);
  const dLon = rad(bLon - aLon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Initial compass bearing from a to b, degrees clockwise from north. */
export function bearingDeg(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const y = Math.sin(rad(bLon - aLon)) * Math.cos(rad(bLat));
  const x = Math.cos(rad(aLat)) * Math.sin(rad(bLat)) - Math.sin(rad(aLat)) * Math.cos(rad(bLat)) * Math.cos(rad(bLon - aLon));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

const QUAKE_NEAR_KM = 1000;
const QUAKE_MIN_MAGNITUDE = 6.5;
const QUAKE_RECENT_MS = 24 * 3600 * 1000;

/**
 * F34: a strong, recent quake close enough that a coast near the visitor
 * could be affected. GDACS does not flag tsunamis directly, so this is a
 * prompt to check official advice, not a claim that a warning exists.
 */
export function nearbyQuake(hazards: Hazards | null, lat: number | null, lon: number | null, now = Date.now()) {
  if (!hazards || lat === null || lon === null) return null;
  const hits = hazards.quakes
    .filter(
      (q) =>
        q.alert !== "Green" &&
        q.magnitude >= QUAKE_MIN_MAGNITUDE &&
        now - Date.parse(q.at) < QUAKE_RECENT_MS &&
        distanceKm(lat, lon, q.lat, q.lon) < QUAKE_NEAR_KM,
    )
    .sort((a, b) => b.magnitude - a.magnitude);
  const q = hits[0];
  return q ? { ...q, km: Math.round(distanceKm(lat, lon, q.lat, q.lon)) } : null;
}
