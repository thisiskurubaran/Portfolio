"use client";

import { useEffect, useState } from "react";
import { experience } from "@/content/experience";
import { ui } from "@/content/ui";
import { useStore } from "@/state/store";
import { RoleCard } from "./StationPanel";

/**
 * F26: after local midnight, a quiet pass over the dark side carries the
 * earliest role in the record. There is no archived project to show, so
 * the first job stands in for it.
 */
export function NightPass() {
  const phase = useStore((s) => s.phase);
  const [hour, setHour] = useState<number | null>(null);
  const [closed, setClosed] = useState(false);
  useEffect(() => {
    const tick = () => setHour(new Date().getHours());
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);
  if (phase !== "orbit" || closed || hour === null || hour >= 5) return null;
  const first = experience[experience.length - 1]!;
  return (
    <section className="panel sighting night-pass" aria-label={ui.nightPass.label}>
      <p className="panel-kicker">{ui.nightPass.label}</p>
      <p>{ui.nightPass.intro}</p>
      <RoleCard role={first} />
      <button type="button" className="hud-button small" onClick={() => setClosed(true)}>
        {ui.sightings.dismiss}
      </button>
    </section>
  );
}
