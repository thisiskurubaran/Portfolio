"use client";

import Link from "next/link";
import { ui } from "@/content/ui";
import { useSceneStore } from "@/state/store";

export function PlainOffer() {
  const reason = useSceneStore((s) => s.plainOffer);
  if (!reason) return null;

  return (
    <div className="plain-offer" role="status">
      <p>{reason === "no-webgl" ? ui.plainOffer.noWebgl : ui.plainOffer.slow}</p>
      <div className="plain-offer-actions">
        <Link href="/plain">{ui.plainOffer.open}</Link>
        {reason === "slow" && (
          <button type="button" onClick={() => useSceneStore.getState().dismissPlainOffer()}>
            {ui.plainOffer.keep}
          </button>
        )}
      </div>
    </div>
  );
}
