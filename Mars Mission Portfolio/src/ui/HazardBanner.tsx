"use client";

import { useEffect, useState } from "react";
import { ui } from "@/content/ui";
import { gScale, rScale, sScale } from "@/space/spaceWeather";
import { useConditions } from "@/state/conditions";
import { distanceKm, type Hazards, hazardsSchema, nearbyQuake } from "@/weather/hazards";

const STORM_NEAR_KM = 800;

/**
 * F34: a calm, factual advisory for a real hazard near the visitor (a
 * strong quake, a tropical cyclone) or extreme real space weather, with a
 * link to the official source. Never staged, never dramatised.
 */
export function HazardBanner() {
  const [hazards, setHazards] = useState<Hazards | null>(null);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const place = useConditions((s) => s.conditions?.visitor?.place ?? null);
  const sw = useConditions((s) => s.spaceWeather);

  useEffect(() => {
    let live = true;
    fetch("/api/hazards", { signal: AbortSignal.timeout(15_000) })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const p = hazardsSchema.safeParse(j);
        if (live && p.success) setHazards(p.data);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  const items: { id: string; title: string; text: string; url: string | null }[] = [];
  const quake = nearbyQuake(hazards, place?.lat ?? null, place?.lon ?? null);
  if (quake) items.push({ id: quake.id, title: ui.hazard.quakeTitle, text: ui.hazard.quake(quake.magnitude, quake.name, quake.km), url: quake.url });
  if (place && hazards) {
    for (const s of hazards.storms) {
      const km = distanceKm(place.lat, place.lon, s.lat, s.lon);
      if (km < STORM_NEAR_KM) items.push({ id: s.id, title: ui.hazard.stormTitle, text: ui.hazard.storm(s.name, s.category, Math.round(km)), url: s.url });
    }
  }
  // Severe space weather only: G4 and up, S3 and up, R3 and up.
  if (sw && sw.source === "live") {
    const g = gScale(sw.kp);
    const s = sScale(sw.protons);
    const r = rScale(sw.flare?.cls ?? null);
    if (g >= 4 || s >= 3 || r >= 3) {
      items.push({ id: `swpc-${g}${s}${r}`, title: ui.hazard.spaceTitle, text: ui.hazard.space(g, s, r), url: "https://www.swpc.noaa.gov/" });
    }
  }
  const item = items.find((i) => !dismissed.includes(i.id));
  if (!item) return null;
  return (
    <div className="panel hazard-banner" role="status">
      <p className="panel-kicker">{item.title}</p>
      <p>{item.text}</p>
      <p className="planner-note">{ui.hazard.advice}</p>
      <div className="brief-actions">
        {item.url && (
          <a className="hud-button small" href={item.url} target="_blank" rel="noopener noreferrer">
            {ui.hazard.source}
          </a>
        )}
        <button type="button" className="hud-button small" onClick={() => setDismissed((d) => [...d, item.id])}>
          {ui.hazard.dismiss}
        </button>
      </div>
    </div>
  );
}
