import { certifications, experience } from "@/content";
import type { AppId } from "@/os/apps/registry";

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

// Content dates are month-level, like "Sep 2025".
export function parseMonth(value: string): { year: number; month: number } | null {
  const [m, y] = value.toLowerCase().split(" ");
  const month = MONTHS.indexOf((m ?? "").slice(0, 3));
  const year = Number(y);
  return month >= 0 && Number.isFinite(year) ? { year, month } : null;
}

export interface CareerEvent {
  year: number;
  month: number;
  title: string;
  kind: "role" | "certificate";
  app: AppId;
}

// Milestones taken straight from the experience and certification records.
export const careerEvents: CareerEvent[] = [
  ...experience.flatMap((r) => {
    const at = parseMonth(r.start);
    return at ? [{ ...at, title: `Started as ${r.title.split(" (")[0]} at ${r.company}`, kind: "role" as const, app: "experience" as const }] : [];
  }),
  ...certifications.flatMap((c) => {
    const at = parseMonth(c.date);
    return at ? [{ ...at, title: `Earned ${c.name} (${c.issuer})`, kind: "certificate" as const, app: "certifications" as const }] : [];
  }),
];

export const eventsIn = (year: number, month: number) => careerEvents.filter((e) => e.year === year && e.month === month);
