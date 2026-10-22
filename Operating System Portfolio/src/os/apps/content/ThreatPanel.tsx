"use client";

import { useEffect, useState } from "react";
import type { ThreatSummary } from "@/lib/threats";

const TYPE_LABELS: Record<string, string> = {
  probe: "Probed a hidden path",
  honeypot: "Tried the decoy admin",
  injection: "Sent an injection payload",
  ratelimit: "Hit a rate limit",
};

function countryName(code: string) {
  if (code === "Unknown") return "Unknown";
  try {
    return new Intl.DisplayNames([], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

function Bars({ data, label }: { data: Record<string, number>; label: (k: string) => string }) {
  const rows = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const max = Math.max(1, ...rows.map(([, v]) => v));
  if (rows.length === 0) return <p className="text-sm opacity-60">Nothing blocked.</p>;
  return (
    <ul className="space-y-1.5">
      {rows.map(([k, v]) => (
        <li key={k} className="grid grid-cols-[10rem_1fr_2.5rem] items-center gap-2 text-sm">
          <span className="truncate opacity-85">{label(k)}</span>
          <span aria-hidden className="h-2 rounded-full bg-accent" style={{ width: `${(v / max) * 100}%` }} />
          <span className="text-right tabular-nums">{v}</span>
        </li>
      ))}
    </ul>
  );
}

// F39: what the firewall refused in the last week, as counts. No addresses,
// no people, and countries only from the request's own header.
export function ThreatPanel() {
  const [data, setData] = useState<ThreatSummary | null | "error">(null);
  useEffect(() => {
    fetch("/api/threats")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData("error"));
  }, []);
  if (data === null) return <p className="text-sm opacity-60">Loading</p>;
  if (data === "error") return <p className="text-sm opacity-60">The firewall log could not be loaded.</p>;
  return (
    <div className="space-y-4 rounded-control bg-glass p-4">
      <p className="text-sm">
        <span className="text-2xl font-light tabular-nums">{data.total}</span> attempts blocked in the last {data.days} days.
      </p>
      <div>
        <h3 className="mb-2 text-xs uppercase tracking-wide opacity-60">By kind</h3>
        <Bars data={data.byType} label={(k) => TYPE_LABELS[k] ?? k} />
      </div>
      <div>
        <h3 className="mb-2 text-xs uppercase tracking-wide opacity-60">By country</h3>
        <Bars data={data.byCountry} label={countryName} />
      </div>
      <p className="text-xs opacity-60">The firewall only refuses and counts. It never scans, probes or reaches back toward anyone.</p>
    </div>
  );
}
