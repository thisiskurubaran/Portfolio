"use client";

import { useEffect, useState } from "react";
import { profile } from "@/content/profile";
import { ui } from "@/content/ui";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { board } from "@/scene/astronaut/guideRuntime";
import { setAstroMode } from "@/scene/astronaut/astronautRuntime";
import { useStore } from "@/state/store";
import { launchAt, skip } from "./missionActions";
import { PadWeather, useLaunchCall } from "./PadWeather";

const TITLE_MS = 3200;

/** Phase 1: the mission brief on the pad, which is the about section. */
export function MissionBrief() {
  const [titleIndex, setTitleIndex] = useState(0);
  const reduced = useReducedMotion();
  const call = useLaunchCall();

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => setTitleIndex((i) => (i + 1) % profile.titles.length), TITLE_MS);
    return () => window.clearInterval(id);
  }, [reduced]);

  return (
    <section className="panel brief" aria-labelledby="brief-heading">
      <p className="panel-kicker">{ui.brief.label}</p>
      <h2 id="brief-heading">{profile.name}</h2>
      {/* Rotating titles are decorative; the full list is announced once below. */}
      <p className="brief-title" aria-hidden="true">
        {profile.titles[titleIndex]}
      </p>
      <p className="sr-only">{profile.titles.join(", ")}</p>
      <p className="brief-meta">
        {profile.location}
        <br />
        {profile.status}
      </p>
      <p>{profile.bio}</p>
      <dl className="brief-stats">
        {profile.stats.map((s) => (
          <div key={s.label}>
            <dt>{s.label}</dt>
            <dd>{s.value}</dd>
          </div>
        ))}
      </dl>
      <p className="brief-site">{ui.brief.site}</p>
      <PadWeather call={call} />
      <div className="brief-actions">
        {call.go || call.slotMs === null ? (
          // Launch from the brief: the astronaut takes the lift and boards, then the count starts.
          <button type="button" className="hud-button primary" onClick={board}>
            {ui.brief.launch}
          </button>
        ) : (
          <button
            type="button"
            className="hud-button primary"
            onClick={() => {
              setAstroMode("aboard");
              launchAt(call.slotMs!);
            }}
          >
            {ui.weather.launchAtSlot}
          </button>
        )}
        <button type="button" className="hud-button" onClick={skip}>
          {ui.brief.skip}
        </button>
        <button type="button" className="hud-button" onClick={() => useStore.getState().setBriefOpen(false)}>
          {ui.brief.close}
        </button>
      </div>
    </section>
  );
}
