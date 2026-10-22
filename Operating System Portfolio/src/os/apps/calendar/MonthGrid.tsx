"use client";

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

// A Monday-first month grid. Days with a marker get a dot.
export function MonthGrid({ year, month, today, marked = false, compact = false }: { year: number; month: number; today: Date; marked?: boolean; compact?: boolean }) {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const cells = [...Array<null>(offset).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const isToday = (d: number) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
  return (
    <div role="grid" aria-label={first.toLocaleDateString([], { month: "long", year: "numeric" })} className={`grid grid-cols-7 text-center ${compact ? "gap-0.5 text-[11px]" : "gap-1 text-sm"}`}>
      {WEEKDAYS.map((d) => (
        <span key={d} role="columnheader" className="py-1 text-[11px] font-medium text-subtle">
          {d}
        </span>
      ))}
      {cells.map((d, i) =>
        d === null ? (
          <span key={`e${i}`} />
        ) : (
          <span
            key={d}
            role="gridcell"
            aria-current={isToday(d) ? "date" : undefined}
            className={`relative flex items-center justify-center rounded-full tabular-nums ${compact ? "h-6" : "h-9"} ${isToday(d) ? "bg-accent font-semibold text-on-accent" : ""}`}
          >
            {d}
            {marked && d === 1 && !isToday(d) && <span aria-hidden className="absolute bottom-0.5 h-1 w-1 rounded-full bg-accent" />}
          </span>
        ),
      )}
    </div>
  );
}
