export type Season = "winter" | "spring" | "summer" | "autumn";

const NORTH: Season[] = ["winter", "winter", "spring", "spring", "spring", "summer", "summer", "summer", "autumn", "autumn", "autumn", "winter"];
const FLIP: Record<Season, Season> = { winter: "summer", spring: "autumn", summer: "winter", autumn: "spring" };

/** Meteorological seasons by month, flipped south of the equator. */
export function seasonAt(date: Date, lat: number | null): Season {
  const north = NORTH[date.getMonth()]!;
  return lat !== null && lat < 0 ? FLIP[north] : north;
}
