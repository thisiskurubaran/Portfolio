import { z } from "zod";

/** The parts of Open-Meteo's `current` block the scene uses. Anything else is ignored. */
export const openMeteoResponse = z.object({
  current: z.object({
    temperature_2m: z.number(),
    precipitation: z.number(),
    rain: z.number(),
    showers: z.number(),
    snowfall: z.number(),
    cloud_cover: z.number(),
    visibility: z.number(),
    wind_speed_10m: z.number(),
    wind_direction_10m: z.number(),
    wind_gusts_10m: z.number(),
    weather_code: z.number(),
    interval: z.number(),
  }),
});

export const weatherSchema = z.object({
  temperature: z.number().min(-90).max(70),
  /** 0 clear to 1 overcast. */
  cloudCover: z.number().min(0).max(1),
  /** Rain rate in mm per hour. */
  rain: z.number().min(0).max(500),
  /** Snowfall rate in cm per hour. */
  snow: z.number().min(0).max(100),
  /** Metres. */
  visibility: z.number().min(0).max(100_000),
  /** km/h. */
  windSpeed: z.number().min(0).max(500),
  gusts: z.number().min(0).max(600),
  /** Degrees the wind blows from, meteorological convention. */
  windDirection: z.number().min(0).max(360),
  /** WMO weather code. */
  code: z.number().int().min(0).max(99),
});

/** Hourly sea level for the visitor's spot, if the marine model covers it. */
export const tideSchema = z.object({
  source: z.literal("open-meteo"),
  points: z
    .array(z.object({ t: z.number(), h: z.number().min(-20).max(20) }))
    .min(6)
    .max(96),
});

export const openMeteoMarine = z.object({
  utc_offset_seconds: z.number(),
  hourly: z.object({
    time: z.array(z.string()),
    sea_level_height_msl: z.array(z.number().nullable()),
  }),
});

export const conditionsSchema = z.object({
  /** City level only: coordinates are rounded before they leave the server. */
  location: z
    .object({
      city: z.string().max(80).nullable(),
      lat: z.number().min(-90).max(90),
      lon: z.number().min(-180).max(180),
    })
    .nullable(),
  weather: weatherSchema.nullable(),
  tide: tideSchema.nullable(),
  source: z.enum(["open-meteo", "fallback"]),
});

export type Weather = z.infer<typeof weatherSchema>;
export type Conditions = z.infer<typeof conditionsSchema>;
export type TideData = z.infer<typeof tideSchema>;
