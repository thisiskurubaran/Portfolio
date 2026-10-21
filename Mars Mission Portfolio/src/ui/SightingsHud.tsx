"use client";

import { useEffect, useState } from "react";
import { ui } from "@/content/ui";
import { rescueNeeded } from "@/scene/weather/rescue";
import { sightings } from "@/scene/weather/Sightings";
import { ENCKE_FACTS, GOLDEN_RECORD, VOYAGERS } from "@/space/sightings";
import { simNow } from "@/state/simClock";
import { useStore } from "@/state/store";

/** Closer than this, a passing satellite is worth a note. */
const PASS_KM = 2000;

/** F12: a short note for each rare sighting in view, earned by staying. */
export function SightingsHud() {
  const phase = useStore((s) => s.phase);
  const [, setTick] = useState(0);
  const [dismissed, setDismissed] = useState<string[]>([]);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const notes: { id: string; title: string; body: string[] }[] = [];
  const c = sightings.comet;
  if (c.shown && (phase === "orbit" || phase === "transit")) {
    notes.push({
      id: "comet",
      title: ENCKE_FACTS.name,
      body: [ui.sightings.comet(c.sunAu, c.fromUsAu, c.mag, ENCKE_FACTS.periodYears)],
    });
  }
  if (sightings.voyager) {
    notes.push({
      id: "voyager",
      title: ui.sightings.voyagerTitle,
      body: [...VOYAGERS.map((v) => ui.sightings.voyager(v.name, v.au, v.launched, v.note)), GOLDEN_RECORD],
    });
  }
  if (sightings.iss !== null && sightings.iss < PASS_KM) {
    notes.push({ id: "iss", title: ui.sightings.issTitle, body: [ui.sightings.iss(sightings.iss)] });
  }
  if (sightings.train && sightings.train.km < PASS_KM * 2) {
    notes.push({ id: "train", title: ui.sightings.trainTitle, body: [ui.sightings.train(sightings.train.count, sightings.train.km)] });
  }
  const shown = notes.filter((n) => !dismissed.includes(n.id));
  // A drone in trouble takes the same spot, and matters more.
  if (shown.length === 0 || rescueNeeded(simNow())) return null;
  const n = shown[0]!;
  return (
    <section className="panel sighting" aria-label={ui.sightings.label}>
      <p className="panel-kicker">{ui.sightings.label}</p>
      <h2>{n.title}</h2>
      {n.body.map((b) => (
        <p key={b}>{b}</p>
      ))}
      <button type="button" className="hud-button small" onClick={() => setDismissed((d) => [...d, n.id])}>
        {ui.sightings.dismiss}
      </button>
    </section>
  );
}
