const RAD = Math.PI / 180;

export type SunPosition = {
  /** Degrees above the horizon. Negative is below. */
  elevation: number;
  /** Degrees clockwise from north. */
  azimuth: number;
};

/**
 * Sun position from the low precision formulas in the Astronomical Almanac.
 * Good to a fraction of a degree, which is plenty for sky colours.
 */
export function sunPosition(date: Date, lat: number, lon: number): SunPosition {
  const n = date.getTime() / 86_400_000 + 2440587.5 - 2451545.0;
  const meanLong = (280.46 + 0.9856474 * n) % 360;
  const anomaly = ((357.528 + 0.9856003 * n) % 360) * RAD;
  const eclLong = (meanLong + 1.915 * Math.sin(anomaly) + 0.02 * Math.sin(2 * anomaly)) * RAD;
  const obliquity = (23.439 - 0.0000004 * n) * RAD;

  const ra = Math.atan2(Math.cos(obliquity) * Math.sin(eclLong), Math.cos(eclLong));
  const dec = Math.asin(Math.sin(obliquity) * Math.sin(eclLong));
  const gmstHours = (18.697374558 + 24.06570982441908 * n) % 24;
  const hourAngle = (gmstHours * 15 + lon) * RAD - ra;
  const phi = lat * RAD;

  const elevation = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(hourAngle));
  const azimuth = Math.atan2(
    -Math.sin(hourAngle),
    Math.tan(dec) * Math.cos(phi) - Math.sin(phi) * Math.cos(hourAngle),
  );
  return { elevation: elevation / RAD, azimuth: ((azimuth / RAD) % 360 + 360) % 360 };
}

/**
 * Rough sun from the local clock alone, for visitors without a location:
 * up at six, highest at noon in the south, down at six.
 */
export function sunFromClock(date: Date): SunPosition {
  const h = date.getHours() + date.getMinutes() / 60;
  return { elevation: 55 * Math.sin((Math.PI * (h - 6)) / 12), azimuth: (90 + (h - 6) * 15 + 360) % 360 };
}
