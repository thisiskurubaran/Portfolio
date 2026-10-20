import { NextResponse } from "next/server";
import { distanceKm, hazardQuake, hazardStorm, type HazardQuake, type Hazards, type HazardStorm } from "@/weather/hazards";

export const runtime = "edge";

const CACHE_SECONDS = 30 * 60;
const QUAKE_MAX_AGE_MS = 3 * 24 * 3600 * 1000;
// Cyclones: the SEARCH list is points only; the MAP list carries forecast
// polygons and takes over ten seconds. Quakes: the MAP list is small and has
// every current event, while SEARCH only returns older high alert ones.
const GDACS_STORMS = "https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventlist=TC";
const GDACS_QUAKES = "https://www.gdacs.org/gdacsapi/api/events/geteventlist/MAP?eventtype=EQ";
const NHC = "https://www.nhc.noaa.gov/CurrentStorms.json";

const NHC_CLASS: Record<string, string> = {
  TD: "Tropical depression",
  TS: "Tropical storm",
  HU: "Hurricane",
  STD: "Subtropical depression",
  STS: "Subtropical storm",
  PTC: "Potential tropical cyclone",
};

async function getJson(url: string): Promise<unknown> {
  try {
    const res = await fetch(url, { next: { revalidate: CACHE_SECONDS }, signal: AbortSignal.timeout(8000) });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

type Feature = { geometry?: { type?: string; coordinates?: unknown }; properties?: Record<string, unknown> };

function points(json: unknown): { lon: number; lat: number; p: Record<string, unknown> }[] {
  const features = (json as { features?: Feature[] } | null)?.features;
  if (!Array.isArray(features)) return [];
  return features.flatMap((f) => {
    const c = f.geometry?.coordinates;
    if (f.geometry?.type !== "Point" || !Array.isArray(c) || !f.properties) return [];
    return [{ lon: Number(c[0]), lat: Number(c[1]), p: f.properties }];
  });
}

const str = (v: unknown) => (typeof v === "string" ? v : "");
const severity = (p: Record<string, unknown>) => (p.severitydata ?? {}) as Record<string, unknown>;
const reportUrl = (p: Record<string, unknown>) => str((p.url as Record<string, unknown> | undefined)?.report);

function gdacsStorms(json: unknown): HazardStorm[] {
  return points(json).flatMap(({ lat, lon, p }) => {
    if (p.iscurrent !== "true") return [];
    const s = severity(p);
    const parsed = hazardStorm.safeParse({
      id: `gdacs-${str(String(p.eventid))}`,
      name: (str(p.eventname) || str(p.name)).slice(0, 80),
      category: str(s.severitytext).slice(0, 120),
      lat,
      lon,
      windKmh: s.severityunit === "km/h" && typeof s.severity === "number" ? s.severity : null,
      source: "GDACS",
      url: reportUrl(p),
    });
    return parsed.success ? [parsed.data] : [];
  });
}

function nhcStorms(json: unknown): HazardStorm[] {
  const list = (json as { activeStorms?: Record<string, unknown>[] } | null)?.activeStorms;
  if (!Array.isArray(list)) return [];
  return list.flatMap((s) => {
    const kt = Number(s.intensity);
    const kmh = Number.isFinite(kt) ? Math.round(kt * 1.852) : null;
    const label = NHC_CLASS[str(s.classification)] ?? "Tropical cyclone";
    const advisory = (s.publicAdvisory as Record<string, unknown> | undefined)?.url;
    const parsed = hazardStorm.safeParse({
      id: `nhc-${str(s.id)}`,
      name: str(s.name).slice(0, 80),
      category: kmh ? `${label}, ${kmh} km/h winds` : label,
      lat: Number(s.latitudeNumeric),
      lon: Number(s.longitudeNumeric),
      windKmh: kmh,
      source: "NHC",
      url: str(advisory),
    });
    return parsed.success ? [parsed.data] : [];
  });
}

function gdacsQuakes(json: unknown): HazardQuake[] {
  const now = Date.now();
  return points(json).flatMap(({ lat, lon, p }) => {
    const at = str(p.fromdate);
    if (p.iscurrent !== "true" || now - Date.parse(`${at}Z`) > QUAKE_MAX_AGE_MS) return [];
    const parsed = hazardQuake.safeParse({
      id: `gdacs-${String(p.eventid)}`,
      name: str(p.name),
      magnitude: Number(severity(p).severity),
      lat,
      lon,
      alert: str(p.alertlevel),
      at: `${at}Z`,
      url: reportUrl(p),
    });
    return parsed.success ? [parsed.data] : [];
  });
}

/** F05 and F34: current tropical cyclones and recent strong quakes, worldwide. */
export async function GET() {
  const [tc, eq, nhc] = await Promise.all([getJson(GDACS_STORMS), getJson(GDACS_QUAKES), getJson(NHC)]);

  const fromNhc = nhcStorms(nhc);
  // NHC and GDACS both list Atlantic and East Pacific storms. Keep NHC's,
  // which link to the forecaster's own advisory.
  const fromGdacs = gdacsStorms(tc).filter((g) => !fromNhc.some((n) => distanceKm(g.lat, g.lon, n.lat, n.lon) < 300));

  const body: Hazards = {
    storms: [...fromNhc, ...fromGdacs].slice(0, 40),
    quakes: gdacsQuakes(eq).slice(0, 40),
  };

  return NextResponse.json(body, {
    // The same for every visitor, so the CDN can share it.
    headers: { "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=600` },
  });
}
