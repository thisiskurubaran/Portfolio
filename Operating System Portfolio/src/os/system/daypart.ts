"use client";

import { useClock } from "./clock";

export type Daypart = "dawn" | "day" | "dusk" | "night";

// Hours on the visitor's own clock. Shared by the dynamic wallpaper and the
// auto theme so both change together.
export function daypartAt(date: Date): Daypart {
  const h = date.getHours() + date.getMinutes() / 60;
  if (h >= 5 && h < 7.5) return "dawn";
  if (h >= 7.5 && h < 17.5) return "day";
  if (h >= 17.5 && h < 20) return "dusk";
  return "night";
}

export function useDaypart(): Daypart | null {
  const now = useClock(60_000);
  return now ? daypartAt(now) : null;
}
