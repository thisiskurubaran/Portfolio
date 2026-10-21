import { NextResponse } from "next/server";
import { type Omm, ommSchema, type Satellites, satellitesSchema } from "@/space/satellites";

export const runtime = "edge";

// CelesTrak asks clients to fetch each element set at most every couple of hours.
const CACHE_SECONDS = 2 * 3600;
const BASE = "https://celestrak.org/NORAD/elements/gp.php";

async function omm(query: string): Promise<Omm[]> {
  try {
    const res = await fetch(`${BASE}?${query}&FORMAT=json`, { next: { revalidate: CACHE_SECONDS }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const json: unknown = await res.json();
    if (!Array.isArray(json)) return [];
    return json.flatMap((o) => {
      const p = ommSchema.safeParse(o);
      return p.success ? [p.data] : [];
    });
  } catch {
    return [];
  }
}

/**
 * Starlink satellites fly in a tight line for days after launch, before
 * they raise their orbits and spread out. Pick the newest launch with a
 * full stack still bunched up in a low orbit.
 */
function newestTrain(recent: Omm[]): Omm[] {
  const groups = new Map<string, Omm[]>();
  for (const o of recent) {
    if (!o.OBJECT_NAME.startsWith("STARLINK")) continue;
    // Below about 400 km: still at the insertion altitude (mean motion above ~15.5 rev/day).
    if (o.MEAN_MOTION < 15.5) continue;
    const launch = o.OBJECT_ID.slice(0, 8);
    groups.set(launch, [...(groups.get(launch) ?? []), o]);
  }
  const best = [...groups.entries()].filter(([, g]) => g.length >= 10).sort(([a], [b]) => b.localeCompare(a))[0];
  return best ? best[1].slice(0, 60) : [];
}

/** F12: the ISS and the newest Starlink train, from CelesTrak's public element sets. */
export async function GET() {
  const [iss, recent] = await Promise.all([omm("CATNR=25544"), omm("GROUP=last-30-days")]);
  const draft: Satellites = {
    iss: iss[0] ?? null,
    train: newestTrain(recent),
    source: iss.length || recent.length ? "celestrak" : "fallback",
  };
  const ok = satellitesSchema.safeParse(draft);
  return NextResponse.json(ok.success ? ok.data : { iss: null, train: [], source: "fallback" }, {
    headers: { "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=3600` },
  });
}
