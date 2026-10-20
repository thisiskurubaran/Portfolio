"use client";

import { useEffect } from "react";
import { useSceneStore } from "@/state/store";
import { hazardsSchema } from "@/weather/hazards";
import { conditionsSchema } from "@/weather/schema";

/** Asks the server for local weather and world hazards once. On any failure the scene keeps its clear night defaults. */
export function ConditionsLoader() {
  useEffect(() => {
    const controller = new AbortController();
    let url = "/api/conditions";
    if (process.env.NODE_ENV !== "production") {
      // Pass ?lat=&lon=&city= through so a location can be faked locally.
      const q = new URLSearchParams(window.location.search);
      const pass = new URLSearchParams();
      for (const k of ["lat", "lon", "city"]) {
        const v = q.get(k);
        if (v !== null) pass.set(k, v);
      }
      if ([...pass].length) url += `?${pass}`;
    }

    fetch(url, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const parsed = conditionsSchema.safeParse(json);
        useSceneStore.getState().setConditions(parsed.success ? parsed.data : null);
      })
      .catch(() => {});

    // F05 and F34: shared for every visitor and cached by the CDN.
    fetch("/api/hazards", { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const parsed = hazardsSchema.safeParse(json);
        useSceneStore.getState().setHazards(parsed.success ? parsed.data : null);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  return null;
}
