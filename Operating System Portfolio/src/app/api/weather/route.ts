import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { type Weather } from "@/os/system/weatherTypes";

export const runtime = "edge";

const CACHE_SECONDS = 15 * 60;

const openMeteo = z.object({
  current: z.object({
    temperature_2m: z.number(),
    weather_code: z.number().int(),
    is_day: z.number().int(),
    wind_speed_10m: z.number(),
  }),
});

// One decimal is roughly 11 km: city level, and a coarse enough cache key
// that nearby visitors share one upstream request.
const round1 = (v: number) => Math.round(v * 10) / 10;

function readLocation(request: NextRequest) {
  let lat = Number(request.headers.get("x-vercel-ip-latitude"));
  let lon = Number(request.headers.get("x-vercel-ip-longitude"));
  let city: string | null = null;
  const rawCity = request.headers.get("x-vercel-ip-city");
  if (rawCity) {
    try {
      city = decodeURIComponent(rawCity).slice(0, 80);
    } catch {
      city = null;
    }
  }
  // Vercel geo headers do not exist locally; let development pass a spot.
  if (process.env.NODE_ENV === "development") {
    const q = request.nextUrl.searchParams;
    if (q.has("lat") && q.has("lon")) {
      lat = Number(q.get("lat"));
      lon = Number(q.get("lon"));
      city = q.get("city")?.slice(0, 80) ?? "Dev";
    }
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || (lat === 0 && lon === 0) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return { city, lat: round1(lat), lon: round1(lon) };
}

// F23: the visitor's city weather, from the request's own geo headers.
// The browser's Geolocation API is never used, and nothing is stored.
export async function GET(request: NextRequest) {
  const location = readLocation(request);
  if (!location) return NextResponse.json({ weather: null } satisfies { weather: Weather | null });

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current=temperature_2m,weather_code,is_day,wind_speed_10m&timezone=auto`;
  try {
    const res = await fetch(url, { next: { revalidate: CACHE_SECONDS }, signal: AbortSignal.timeout(4000) });
    if (!res.ok) return NextResponse.json({ weather: null });
    const parsed = openMeteo.safeParse(await res.json());
    if (!parsed.success) return NextResponse.json({ weather: null });
    const c = parsed.data.current;
    const weather: Weather = {
      city: location.city,
      temperature: Math.round(c.temperature_2m),
      code: c.weather_code,
      isDay: c.is_day === 1,
      wind: Math.round(c.wind_speed_10m),
    };
    return NextResponse.json({ weather }, { headers: { "Cache-Control": "private, max-age=600" } });
  } catch {
    return NextResponse.json({ weather: null });
  }
}
