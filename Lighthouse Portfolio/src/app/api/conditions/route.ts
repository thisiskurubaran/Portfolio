import { NextResponse, type NextRequest } from "next/server";
import {
  conditionsSchema,
  openMeteoMarine,
  openMeteoResponse,
  tideSchema,
  type Conditions,
  type TideData,
  type Weather,
} from "@/weather/schema";

export const runtime = "edge";

const CACHE_SECONDS = 15 * 60;
const FIELDS = [
  "temperature_2m",
  "precipitation",
  "rain",
  "showers",
  "snowfall",
  "cloud_cover",
  "visibility",
  "wind_speed_10m",
  "wind_direction_10m",
  "wind_gusts_10m",
  "weather_code",
].join(",");

// One decimal is roughly 11 km: city level, and a coarse enough cache key
// that nearby visitors share one upstream request.
const round1 = (v: number) => Math.round(v * 10) / 10;

function readLocation(request: NextRequest): Conditions["location"] {
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

  const location = { city, lat: round1(lat), lon: round1(lon) };
  const ok = conditionsSchema.shape.location.safeParse(location);
  return ok.success && Number.isFinite(lat) && Number.isFinite(lon) && (lat !== 0 || lon !== 0) ? ok.data : null;
}

async function fetchWeather(lat: number, lon: number): Promise<Weather | null> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=${FIELDS}&timezone=auto`;
  try {
    const res = await fetch(url, {
      next: { revalidate: CACHE_SECONDS },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const parsed = openMeteoResponse.safeParse(await res.json());
    if (!parsed.success) return null;
    const c = parsed.data.current;
    // Precipitation values cover the last interval (15 minutes); scale to per hour.
    const perHour = 3600 / Math.max(c.interval, 60);
    const weather = {
      temperature: c.temperature_2m,
      cloudCover: c.cloud_cover / 100,
      rain: (c.rain + c.showers) * perHour,
      snow: c.snowfall * perHour,
      visibility: c.visibility,
      windSpeed: c.wind_speed_10m,
      gusts: c.wind_gusts_10m,
      windDirection: c.wind_direction_10m,
      code: c.weather_code,
    };
    const ok = conditionsSchema.shape.weather.safeParse(weather);
    return ok.success ? ok.data : null;
  } catch {
    return null;
  }
}

/**
 * F06: sea level for the next day or so. Inland spots and coasts the marine
 * model does not cover come back as nulls, and the client estimates instead.
 */
async function fetchTide(lat: number, lon: number): Promise<TideData | null> {
  const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&hourly=sea_level_height_msl&past_days=1&forecast_days=2&timezone=auto`;
  try {
    const res = await fetch(url, { next: { revalidate: CACHE_SECONDS }, signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const parsed = openMeteoMarine.safeParse(await res.json());
    if (!parsed.success) return null;
    const { time, sea_level_height_msl: heights } = parsed.data.hourly;
    const offsetMs = parsed.data.utc_offset_seconds * 1000;
    const points = time.flatMap((t, i) => {
      const h = heights[i];
      // Times are local to the spot; turn them into UTC instants.
      return h === null || h === undefined ? [] : [{ t: Date.parse(`${t}Z`) - offsetMs, h }];
    });
    const ok = tideSchema.safeParse({ source: "open-meteo", points: points.slice(0, 96) });
    return ok.success ? ok.data : null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const location = readLocation(request);
  const [weather, tide] = location
    ? await Promise.all([fetchWeather(location.lat, location.lon), fetchTide(location.lat, location.lon)])
    : [null, null];
  const body: Conditions = { location, weather, tide, source: weather ? "open-meteo" : "fallback" };

  return NextResponse.json(body, {
    // The answer depends on the visitor's location, so shared caches must not keep it.
    headers: { "Cache-Control": `private, max-age=${CACHE_SECONDS}` },
  });
}
