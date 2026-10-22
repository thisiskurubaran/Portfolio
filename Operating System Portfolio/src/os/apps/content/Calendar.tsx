"use client";

import { useState } from "react";
import { Icon } from "@/design/icons";
import { careerEvents, eventsIn } from "@/os/apps/calendar/events";
import { MonthGrid } from "@/os/apps/calendar/MonthGrid";
import { Card, Page } from "@/os/apps/ui";
import { useClock } from "@/os/system/clock";
import { launch } from "@/os/system/launcher";

// F22: a real calendar on the visitor's own date, with career milestones
// from the experience and certification records.
export default function Calendar() {
  const now = useClock(60_000) ?? new Date();
  const [view, setView] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const events = eventsIn(view.year, view.month);
  const step = (d: number) => setView((v) => ({ year: v.year + Math.floor((v.month + d) / 12), month: (v.month + d + 12) % 12 }));
  const label = new Date(view.year, view.month, 1).toLocaleDateString([], { month: "long", year: "numeric" });
  const recent = [...careerEvents].sort((a, b) => b.year - a.year || b.month - a.month).slice(0, 6);

  return (
    <Page wide>
      <div className="grid gap-5 md:grid-cols-[1fr_16rem]">
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <h2 className="flex-1 font-display text-lg font-semibold">{label}</h2>
            <button aria-label="Previous month" onClick={() => step(-1)} className="flex h-8 w-8 items-center justify-center rounded-control hover:bg-glass-strong">
              <Icon name="chevron" size={16} className="rotate-180" />
            </button>
            <button onClick={() => setView({ year: now.getFullYear(), month: now.getMonth() })} className="rounded-control px-2.5 py-1 text-sm hover:bg-glass-strong">
              Today
            </button>
            <button aria-label="Next month" onClick={() => step(1)} className="flex h-8 w-8 items-center justify-center rounded-control hover:bg-glass-strong">
              <Icon name="chevron" size={16} />
            </button>
          </div>
          <MonthGrid year={view.year} month={view.month} today={now} marked={events.length > 0} />
          <div className="mt-4 space-y-2">
            {events.length === 0 ? (
              <p className="text-sm text-muted">No career milestones this month.</p>
            ) : (
              events.map((e) => (
                <button key={e.title} onClick={() => launch(e.app)} className="flex w-full items-center gap-2 rounded-lg bg-accent/10 px-3 py-2 text-left text-sm ring-1 ring-accent/25">
                  <Icon name={e.kind === "role" ? "experience" : "certifications"} size={15} />
                  {e.title}
                </button>
              ))
            )}
          </div>
        </Card>
        <section aria-label="Career milestones">
          <h3 className="mb-2 text-sm font-semibold">Milestones</h3>
          <ul className="space-y-1.5">
            {recent.map((e) => (
              <li key={e.title}>
                <button onClick={() => setView({ year: e.year, month: e.month })} className="w-full rounded-lg px-2.5 py-2 text-left text-sm hover:bg-glass">
                  <span className="block text-xs text-muted">{new Date(e.year, e.month, 1).toLocaleDateString([], { month: "short", year: "numeric" })}</span>
                  {e.title}
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Page>
  );
}
