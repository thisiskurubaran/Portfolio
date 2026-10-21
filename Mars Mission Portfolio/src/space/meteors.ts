/**
 * Major annual meteor showers, from the International Meteor Organization
 * calendar: activity window, peak, zenithal hourly rate at peak, radiant
 * (J2000) and entry speed. Dates repeat each year to within a day.
 */
export type Shower = {
  id: string;
  name: string;
  /** Month (1 to 12) and day of the start, peak and end of activity. */
  start: [number, number];
  peak: [number, number];
  end: [number, number];
  zhr: number;
  raDeg: number;
  decDeg: number;
  speedKmS: number;
  parent: string;
};

export const SHOWERS: readonly Shower[] = [
  { id: "qua", name: "Quadrantids", start: [12, 28], peak: [1, 3], end: [1, 12], zhr: 80, raDeg: 230, decDeg: 49, speedKmS: 41, parent: "asteroid 2003 EH1" },
  { id: "lyr", name: "Lyrids", start: [4, 14], peak: [4, 22], end: [4, 30], zhr: 18, raDeg: 271, decDeg: 34, speedKmS: 49, parent: "comet C/1861 G1 Thatcher" },
  { id: "eta", name: "Eta Aquariids", start: [4, 19], peak: [5, 6], end: [5, 28], zhr: 50, raDeg: 338, decDeg: -1, speedKmS: 66, parent: "comet 1P/Halley" },
  { id: "sda", name: "Southern Delta Aquariids", start: [7, 12], peak: [7, 30], end: [8, 23], zhr: 25, raDeg: 340, decDeg: -16, speedKmS: 41, parent: "comet 96P/Machholz" },
  { id: "per", name: "Perseids", start: [7, 17], peak: [8, 12], end: [8, 24], zhr: 100, raDeg: 48, decDeg: 58, speedKmS: 59, parent: "comet 109P/Swift-Tuttle" },
  { id: "dra", name: "Draconids", start: [10, 6], peak: [10, 8], end: [10, 10], zhr: 10, raDeg: 262, decDeg: 54, speedKmS: 20, parent: "comet 21P/Giacobini-Zinner" },
  { id: "ori", name: "Orionids", start: [10, 2], peak: [10, 21], end: [11, 7], zhr: 20, raDeg: 95, decDeg: 16, speedKmS: 66, parent: "comet 1P/Halley" },
  { id: "leo", name: "Leonids", start: [11, 6], peak: [11, 17], end: [11, 30], zhr: 15, raDeg: 152, decDeg: 22, speedKmS: 71, parent: "comet 55P/Tempel-Tuttle" },
  { id: "gem", name: "Geminids", start: [12, 4], peak: [12, 14], end: [12, 20], zhr: 150, raDeg: 112, decDeg: 33, speedKmS: 35, parent: "asteroid 3200 Phaethon" },
  { id: "urs", name: "Ursids", start: [12, 17], peak: [12, 22], end: [12, 26], zhr: 10, raDeg: 217, decDeg: 76, speedKmS: 33, parent: "comet 8P/Tuttle" },
];

const DAY = 86_400_000;

/** The date in the given year, or the year either side, closest to ms. */
function nearest(ms: number, [m, d]: [number, number]): number {
  const y = new Date(ms).getUTCFullYear();
  return [y - 1, y, y + 1]
    .map((yy) => Date.UTC(yy, m - 1, d))
    .reduce((a, b) => (Math.abs(b - ms) < Math.abs(a - ms) ? b : a));
}

export type ActiveShower = { shower: Shower; /** Hourly rate now, from the peak ZHR. */ rate: number; atPeak: boolean };

/**
 * Showers active at this moment. Rates fall off either side of the peak;
 * the IMO describes most profiles as roughly exponential, so that is used,
 * scaled to reach a tenth of the peak rate at the edges of activity.
 */
export function activeShowers(ms: number): ActiveShower[] {
  const out: ActiveShower[] = [];
  for (const s of SHOWERS) {
    const peak = nearest(ms, s.peak);
    let start = nearest(peak, s.start);
    if (start > peak) start -= 365 * DAY;
    let end = nearest(peak, s.end);
    if (end < peak) end += 365 * DAY;
    if (ms < start || ms > end) continue;
    const half = ms < peak ? peak - start : end - peak;
    const rate = s.zhr * Math.pow(10, -Math.abs(ms - peak) / Math.max(half, DAY));
    out.push({ shower: s, rate, atPeak: Math.abs(ms - peak) < 1.5 * DAY });
  }
  return out.sort((a, b) => b.rate - a.rate);
}
