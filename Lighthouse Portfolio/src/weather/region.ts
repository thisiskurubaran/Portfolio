export type MajorStormName = "hurricane" | "typhoon" | "cyclone";

/**
 * What a tropical cyclone is called where the visitor is. Basin edges are
 * rough longitude bands, which is enough to pick a name.
 */
export function majorStormName(lat: number | null, lon: number | null): MajorStormName {
  if (lat === null || lon === null) return "hurricane";
  // Indian Ocean, both hemispheres.
  if (lon >= 30 && lon < 100) return "cyclone";
  if (lat >= 0) {
    // North West Pacific.
    if (lon >= 100) return "typhoon";
    // North East Pacific and the Atlantic.
    return "hurricane";
  }
  // South Pacific and around Australia.
  return "cyclone";
}

/** North east US coast between October and April, where winter storms are nor'easters. */
export function isNorEasterCoast(lat: number | null, lon: number | null, month: number): boolean {
  if (lat === null || lon === null) return false;
  const winter = month >= 9 || month <= 3;
  return winter && lat >= 35 && lat <= 47.5 && lon >= -78 && lon <= -65;
}
