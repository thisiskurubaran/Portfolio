"use client";

import Link from "next/link";
import { ui } from "@/content/ui";
import { useStore } from "@/state/store";

/** Suggests the plain mission file when the scene cannot run, or runs badly. */
export function PlainOffer() {
  const reason = useStore((s) => s.plainOffer);
  const dismiss = useStore((s) => s.dismissPlainOffer);
  if (!reason) return null;

  return (
    <div className="panel plain-offer" role="status">
      <p>{reason === "no-webgl" ? ui.plainOffer.noWebgl : ui.plainOffer.slow}</p>
      <div className="brief-actions">
        <Link href="/plain" className="hud-button primary">
          {ui.plainOffer.open}
        </Link>
        {reason === "slow" && (
          <button type="button" className="hud-button" onClick={dismiss}>
            {ui.plainOffer.keep}
          </button>
        )}
      </div>
    </div>
  );
}
