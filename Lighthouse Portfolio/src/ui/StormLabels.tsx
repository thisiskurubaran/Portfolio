"use client";

import { useEffect, useRef, useState } from "react";
import { ui } from "@/content/ui";
import { shipRuntime } from "@/scene/ships/shipRuntime";
import { stormKey } from "@/scene/StormSwirls";
import { useSceneStore } from "@/state/store";
import { distanceKm } from "@/weather/hazards";

/** F05: names over the horizon swirls. Each opens the storm's details and official advisory. */
export function StormLabels() {
  const storms = useSceneStore((s) => s.hazards?.storms ?? null);
  const loc = useSceneStore((s) => s.conditions?.location ?? null);
  const panelOpen = useSceneStore((s) => s.panelOpen);
  const [openId, setOpenId] = useState<string | null>(null);
  const refs = useRef(new Map<string, HTMLDivElement>());

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      for (const [id, el] of refs.current) {
        const s = shipRuntime.get(stormKey(id));
        const shown = !!s?.onScreen || el.contains(document.activeElement);
        el.style.opacity = shown ? "1" : "0";
        el.style.pointerEvents = shown ? "auto" : "none";
        if (s) el.style.transform = `translate(${s.sx}px, ${s.sy}px) translate(-50%, -100%)`;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  if (!storms?.length || !loc) return null;

  return (
    <nav className="ship-labels" aria-label={ui.liveStorms.nav} inert={panelOpen}>
      {storms.map((s) => {
        const open = openId === s.id;
        const km = Math.round(distanceKm(loc.lat, loc.lon, s.lat, s.lon));
        return (
          <div
            key={s.id}
            className="storm-label"
            ref={(el) => {
              if (el) refs.current.set(s.id, el);
              else refs.current.delete(s.id);
            }}
          >
            <button
              type="button"
              className="ship-label storm-label-button"
              aria-expanded={open}
              onClick={() => setOpenId(open ? null : s.id)}
            >
              <span className="ship-label-title">{s.name}</span>
            </button>
            {open && (
              <div className="storm-details">
                <p>{s.category}</p>
                <p>
                  {km.toLocaleString()} {ui.liveStorms.away}
                </p>
                <p>
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    {ui.liveStorms.advisory}
                  </a>{" "}
                  ({ui.liveStorms.source}: {s.source})
                </p>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
