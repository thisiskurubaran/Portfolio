import { NextResponse } from "next/server";
import { flareFlux, type SpaceWeather, spaceWeatherSchema } from "@/space/spaceWeather";

export const runtime = "edge";

const CACHE_SECONDS = 15 * 60;
const SWPC = "https://services.swpc.noaa.gov/json";

async function getJson(url: string): Promise<unknown> {
  try {
    const res = await fetch(url, { next: { revalidate: CACHE_SECONDS }, signal: AbortSignal.timeout(6000) });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

const rows = (j: unknown): Record<string, unknown>[] => (Array.isArray(j) ? j.filter((r) => r && typeof r === "object") : []);

function kp(json: unknown): { kp: number | null; kpAt: string | null } {
  const last = rows(json).at(-1);
  const v = Number(last?.estimated_kp ?? last?.kp_index);
  return Number.isFinite(v) ? { kp: Math.min(Math.max(v, 0), 9), kpAt: String(last?.time_tag ?? "").slice(0, 40) } : { kp: null, kpAt: null };
}

function flare(json: unknown): SpaceWeather["flare"] {
  const list = rows(json).flatMap((r) => {
    const cls = String(r.max_class ?? "");
    return /^[ABCMX]\d+(\.\d+)?$/.test(cls) ? [{ cls, at: String(r.max_time ?? r.begin_time ?? "").slice(0, 40) }] : [];
  });
  return list.sort((a, b) => flareFlux(b.cls) - flareFlux(a.cls))[0] ?? null;
}

function protons(json: unknown): number | null {
  const ten = rows(json).filter((r) => r.energy === ">=10 MeV");
  const v = Number(ten.at(-1)?.flux);
  return Number.isFinite(v) && v >= 0 ? v : null;
}

function cmes(json: unknown): SpaceWeather["cmes"] {
  return rows(json)
    .slice(-10)
    .flatMap((r) => {
      const analyses = Array.isArray(r.cmeAnalyses) ? (r.cmeAnalyses as Record<string, unknown>[]) : [];
      const best = analyses.find((a) => a.isMostAccurate) ?? analyses[0];
      const speed = Number(best?.speed);
      const item = {
        id: String(r.activityID ?? "").slice(0, 64),
        at: String(r.startTime ?? "").slice(0, 40),
        speed: Number.isFinite(speed) ? speed : null,
        link: String(r.link ?? ""),
      };
      return spaceWeatherSchema.shape.cmes.element.safeParse(item).success ? [item] : [];
    });
}

/** F05: Kp, flares and protons from NOAA SWPC; CMEs from NASA DONKI. */
export async function GET() {
  const end = new Date();
  const start = new Date(end.getTime() - 3 * 86_400_000);
  const day = (d: Date) => d.toISOString().slice(0, 10);
  // DEMO_KEY works without sign up, with a low hourly limit; the cache keeps well under it.
  const key = process.env.NASA_API_KEY ?? "DEMO_KEY";
  const [k, x, p, c] = await Promise.all([
    getJson(`${SWPC}/planetary_k_index_1m.json`),
    getJson(`${SWPC}/goes/primary/xray-flares-latest.json`),
    getJson(`${SWPC}/goes/primary/integral-protons-1-day.json`),
    getJson(`https://api.nasa.gov/DONKI/CME?startDate=${day(start)}&endDate=${day(end)}&api_key=${key}`),
  ]);
  const kpv = kp(k);
  const draft: SpaceWeather = {
    ...kpv,
    flare: flare(x),
    protons: protons(p),
    cmes: cmes(c),
    source: kpv.kp === null && !x && !p ? "fallback" : "live",
  };
  const ok = spaceWeatherSchema.safeParse(draft);
  const body: SpaceWeather = ok.success
    ? ok.data
    : { kp: null, kpAt: null, flare: null, protons: null, cmes: [], source: "fallback" };
  return NextResponse.json(body, {
    headers: { "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=600` },
  });
}
