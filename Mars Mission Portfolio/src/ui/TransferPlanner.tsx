"use client";

import { useEffect, useState } from "react";
import { ui } from "@/content/ui";
import { PROPELLANT_KG } from "@/physics/ship";
import type { Transfer } from "@/physics/transfer";
import { departureBurnPropellant, planTransfer, transit } from "@/scene/transitRuntime";
import { sub } from "@/physics/vec";
import { heliocentric } from "@/space/elements";
import { marsDustSeason, marsLs, marsYear, northernSeason } from "@/space/seasons";
import { sunPosition } from "@/space/sun";
import { simNow } from "@/state/simClock";
import { formatUtc } from "./format";
import { depart } from "./missionActions";

const DAY = 86_400_000;

function date(ms: number): string {
  return formatUtc(ms).slice(0, 10);
}

/** F11: today's real geometry and seasons, which set how hard the trip is. */
function Seasons({ plan }: { plan: Transfer }) {
  const now = simNow();
  const apart = Math.hypot(...sub(heliocentric("mars", now).r, heliocentric("earth", now).r));
  const ls = marsLs(now);
  const earthSeason = northernSeason((sunPosition(now).lon * 180) / Math.PI);
  const days = (plan.departMs - now) / DAY;
  return (
    <>
      <p className="planner-note">
        {days < 45 ? ui.transfer.windowNear(Math.max(Math.round(days), 0)) : ui.transfer.windowFar(Math.round(days))}{" "}
        {ui.transfer.apart(apart)}
      </p>
      <p className="planner-note">
        {ui.transfer.seasons(earthSeason, Math.round(ls), northernSeason(ls), marsYear(now))}
        {marsDustSeason(ls) && ` ${ui.transfer.dustSeason}`}
      </p>
    </>
  );
}

/** Finds the next Earth to Mars window from real positions and offers to fly it. */
export function TransferPlanner() {
  const [plan, setPlan] = useState<Transfer | null | undefined>(undefined);

  useEffect(() => {
    // The search takes a few hundred ms; let the panel paint first.
    const id = window.setTimeout(() => {
      const now = simNow();
      const current = transit.plan;
      setPlan(current && current.departMs > now ? current : planTransfer(now));
    }, 50);
    return () => window.clearTimeout(id);
  }, []);

  if (plan === undefined) {
    return (
      <section className="panel planner" aria-label={ui.transfer.label}>
        <p className="panel-kicker">{ui.transfer.label}</p>
        <p>{ui.transfer.planning}</p>
      </section>
    );
  }
  if (plan === null) {
    return (
      <section className="panel planner" aria-label={ui.transfer.label}>
        <p className="panel-kicker">{ui.transfer.label}</p>
        <p>{ui.transfer.none}</p>
      </section>
    );
  }

  const prop = departureBurnPropellant(plan);
  const rows: [string, string][] = [
    [ui.transfer.depart, `${date(plan.departMs)} (${ui.transfer.inDays((plan.departMs - simNow()) / DAY)})`],
    [ui.transfer.arrive, date(plan.arriveMs)],
    [ui.transfer.flight, `${Math.round((plan.arriveMs - plan.departMs) / DAY)} days`],
    [ui.transfer.burn, `${plan.departBurn.toFixed(2)} km/s`],
    [ui.transfer.c3, `${(plan.vInfDepart ** 2).toFixed(1)} km²/s²`],
    [ui.transfer.propellant, `${(prop / 1000).toFixed(1)} t of ${(PROPELLANT_KG / 1000).toFixed(0)} t`],
  ];
  return (
    <section className="panel planner" aria-label={ui.transfer.label}>
      <p className="panel-kicker">{ui.transfer.label}</p>
      <dl className="planner-rows">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <Seasons plan={plan} />
      <p className="planner-note">{ui.transfer.waitNote}</p>
      <button type="button" className="hud-button primary" onClick={depart}>
        {ui.transfer.go}
      </button>
    </section>
  );
}
