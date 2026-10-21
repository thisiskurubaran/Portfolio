import { NextResponse, type NextRequest } from "next/server";
import {
  conditionsSchema,
  type Conditions,
  type Forecast,
  forecastSchema,
  openMeteoResponse,
  type Weather,
} from "@/weather/schema";

export const runtime = "edge";

const CACHE_SECONDS = 15 * 60;
const CURRENT = "temperature_2m,rain,showers,cloud_cover,wind_speed_10m,wind_gusts_10m,weather_code";
const HOURLY = "weather_code,wind_gusts_10m,cloud_cover";
/** Sriharikota, rounded the same way as visitor locations. */
const PAD = { lat: 13.7, lon: 80.2 };

// One decimal is roughly 11 km: city level, and a coarse enough cache key
// that nearby visitors share one upstream request.
const round1 = (v: number) => Math.round(v * 10) / 10;

function readPlace(request: NextRequest) {
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
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || (lat === 0 && lon === 0)) return null;
  const ok = conditionsSchema.shape.visitor.unwrap().shape.place.safeParse({ city, lat: round1(lat), lon: round1(lon) });
  return ok.success ? ok.data : null;
}

async function fetchWeather(lat: number, lon: number): Promise<{ weather: Weather | null; forecast: Forecast }> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=${CURRENT}&hourly=${HOURLY}&forecast_days=3&timezone=GMT`;
  try {
    const res = await fetch(url, { next: { revalidate: CACHE_SECONDS }, signal: AbortSignal.timeout(4000) });
    if (!res.ok) return { weather: null, forecast: [] };
    const parsed = openMeteoResponse.safeParse(await res.json());
    if (!parsed.success) return { weather: null, forecast: [] };
    const c = parsed.data.current;
    // Rain values cover the last interval (15 minutes); scale to per hour.
    const perHour = 3600 / Math.max(c.interval, 60);
    const w = conditionsSchema.shape.pad.shape.weather.safeParse({
      temperature: c.temperature_2m,
      cloudCover: c.cloud_cover / 100,
      rain: (c.rain + c.showers) * perHour,
      windSpeed: c.wind_speed_10m,
      gusts: c.wind_gusts_10m,
      code: c.weather_code,
    });
    const h = parsed.data.hourly;
    const hours = h.time.flatMap((t, i) => {
      const code = h.weather_code[i];
      const gusts = h.wind_gusts_10m[i];
      const cloud = h.cloud_cover[i];
      if (code == null || gusts == null || cloud == null) return [];
      return [{ t: Date.parse(`${t}Z`), code, gusts, cloudCover: cloud / 100 }];
    });
    const f = forecastSchema.safeParse(hours.slice(0, 72));
    return { weather: w.success ? w.data : null, forecast: f.success ? f.data : [] };
  } catch {
    return { weather: null, forecast: [] };
  }
}

/** F02: the pad's real weather and forecast, and the visitor's own, city level only. */
export async function GET(request: NextRequest) {
  const place = readPlace(request);
  const [pad, mine] = await Promise.all([
    fetchWeather(PAD.lat, PAD.lon),
    place ? fetchWeather(place.lat, place.lon) : Promise.resolve(null),
  ]);
  const body: Conditions = {
    visitor: place ? { place, weather: mine?.weather ?? null } : null,
    pad,
    source: pad.weather ? "open-meteo" : "fallback",
  };
  return NextResponse.json(body, {
    // The answer depends on the visitor's location, so shared caches must not keep it.
    headers: { "Cache-Control": `private, max-age=${CACHE_SECONDS}` },
  });
}
