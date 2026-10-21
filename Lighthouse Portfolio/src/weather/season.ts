export type Season = "winter" | "spring" | "summer" | "autumn";

const NORTH: Season[] = ["winter", "winter", "spring", "spring", "spring", "summer", "summer", "summer", "autumn", "autumn", "autumn", "winter"];
const FLIP: Record<Season, Season> = { winter: "summer", spring: "autumn", summer: "winter", autumn: "spring" };

/** Meteorological seasons by month, flipped south of the equator. */
export function seasonAt(date: Date, lat: number | null): Season {
  const north = NORTH[date.getMonth()]!;
  return lat !== null && lat < 0 ? FLIP[north] : north;
}

/** How each season bends the weather. Colour tints live with the scene palette. */
export const SEASON_EFFECTS: Record<Season, { wind: number; fog: number }> = {
  winter: { wind: 1, fog: 1 },
  // Lighter fog in spring.
  spring: { wind: 1, fog: 0.6 },
  summer: { wind: 1, fog: 1 },
  // Autumn storms: the same wind builds a bigger sea.
  autumn: { wind: 1.2, fog: 1 },
};
