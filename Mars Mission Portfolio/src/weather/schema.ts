import { z } from "zod";

/** The parts of Open-Meteo's forecast the pad uses. Anything else is ignored. */
export const openMeteoResponse = z.object({
  utc_offset_seconds: z.number(),
  current: z.object({
    temperature_2m: z.number(),
    rain: z.number(),
    showers: z.number(),
    cloud_cover: z.number(),
    wind_speed_10m: z.number(),
    wind_gusts_10m: z.number(),
    weather_code: z.number(),
    interval: z.number(),
  }),
  hourly: z.object({
    time: z.array(z.string()),
    weather_code: z.array(z.number().nullable()),
    wind_gusts_10m: z.array(z.number().nullable()),
    cloud_cover: z.array(z.number().nullable()),
  }),
});

export const weatherSchema = z.object({
  temperature: z.number().min(-90).max(70),
  /** 0 clear to 1 overcast. */
  cloudCover: z.number().min(0).max(1),
  /** mm per hour. */
  rain: z.number().min(0).max(500),
  /** km/h. */
  windSpeed: z.number().min(0).max(500),
  gusts: z.number().min(0).max(600),
  /** WMO weather code. */
  code: z.number().int().min(0).max(99),
});

/** Hourly forecast, enough to find the next slot that passes the launch rules. */
export const forecastSchema = z
  .array(
    z.object({
      t: z.number(),
      code: z.number().int().min(0).max(99),
      gusts: z.number().min(0).max(600),
      cloudCover: z.number().min(0).max(1),
    }),
  )
  .max(72);

const place = z.object({
  /** City level only: coordinates are rounded before they leave the server. */
  city: z.string().max(80).nullable(),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
});

export const conditionsSchema = z.object({
  /** The visitor's city, from the request's own geo headers. Null when unknown. */
  visitor: z
    .object({
      place,
      weather: weatherSchema.nullable(),
    })
    .nullable(),
  /** The launch site's real weather and forecast. */
  pad: z.object({
    weather: weatherSchema.nullable(),
    forecast: forecastSchema,
  }),
  source: z.enum(["open-meteo", "fallback"]),
});

export type Weather = z.infer<typeof weatherSchema>;
export type Forecast = z.infer<typeof forecastSchema>;
export type Conditions = z.infer<typeof conditionsSchema>;
