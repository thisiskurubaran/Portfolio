import { AU_KM } from "@/physics/constants";

export function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function formatUtc(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

export function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
}

/** "1.62 AU (242.5M km)". */
export function formatDistance(au: number): string {
  // Close to a planet, AU and millions of km both read as zero.
  if (au < 0.01) return `${Math.round(au * AU_KM).toLocaleString("en")} km`;
  const mkm = (au * AU_KM) / 1e6;
  return `${au.toFixed(2)} AU (${mkm.toFixed(1)}M km)`;
}

/** "13 min 28 s" or "1 h 12 min". */
export function formatDuration(seconds: number): string {
  const s = Math.round(seconds);
  if (s >= 3600) return `${Math.floor(s / 3600)} h ${Math.floor(s / 60) % 60} min`;
  if (s >= 60) return `${Math.floor(s / 60)} min ${s % 60} s`;
  return `${s} s`;
}
