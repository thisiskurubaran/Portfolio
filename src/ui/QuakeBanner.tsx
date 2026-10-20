"use client";

import { useState } from "react";
import { ui } from "@/content/ui";
import { useSceneStore } from "@/state/store";
import { nearbyQuake } from "@/weather/hazards";

/** F34: a calm, factual note with the official report. No drama in the scene. */
export function QuakeBanner() {
  const hazards = useSceneStore((s) => s.hazards);
  const loc = useSceneStore((s) => s.conditions?.location ?? null);
  const [dismissed, setDismissed] = useState<string | null>(null);

  const quake = nearbyQuake(hazards, loc?.lat ?? null, loc?.lon ?? null);
  if (!quake || dismissed === quake.id) return null;

  return (
    <div className="quake-banner" role="status">
      <p className="quake-title">{ui.quake.title}</p>
      <p>{ui.quake.summary(quake.magnitude, quake.name, quake.km)}</p>
      <p>{ui.quake.advice}</p>
      <div className="quake-actions">
        <a href={quake.url} target="_blank" rel="noopener noreferrer">
          {ui.quake.report}
        </a>
        <button type="button" onClick={() => setDismissed(quake.id)}>
          {ui.quake.dismiss}
        </button>
      </div>
    </div>
  );
}
