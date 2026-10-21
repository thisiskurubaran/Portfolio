"use client";

import { useEffect, useRef, useState } from "react";
import { transmission } from "@/audio/engine";
import { captions, sound } from "@/audio/sound";
import { commsLines, commsUi } from "@/content/comms";
import { lightTimeSeconds } from "@/physics/lightTimeDelay";
import { heliocentric } from "@/space/elements";
import { comms, type CommsMessage, roundTripMs, sendFromEarth } from "@/state/commsQueue";
import { observer } from "@/state/observer";
import { simNow } from "@/state/simClock";
import { useStore } from "@/state/store";
import { formatDuration } from "./format";

type View = { latest: CommsMessage | null; pending: CommsMessage | null; now: number };

/**
 * Mission control's replies, delayed by the real round trip light time
 * from wherever the ship is. The delay runs in mission time, so it shrinks
 * under time warp and is felt in full on the surface.
 */
export function CommsFeed() {
  const phase = useStore((s) => s.phase);
  const [view, setView] = useState<View>({ latest: null, pending: null, now: 0 });
  const played = useRef(new Set<number>());

  useEffect(() => {
    const line = commsLines[phase];
    if (!line) return;
    const t = simNow();
    const earth = heliocentric("earth", t).r;
    sendFromEarth(line, t, roundTripMs(earth, observer.au, lightTimeSeconds(1)));
  }, [phase]);

  useEffect(() => {
    const tick = () => {
      const now = simNow();
      let latest: CommsMessage | null = null;
      let pending: CommsMessage | null = null;
      for (const m of comms.messages) {
        if (m.arriveMs <= now) latest = m;
        else pending ??= m;
      }
      if (latest && !played.current.has(latest.id)) {
        played.current.add(latest.id);
        if (sound.on && sound.graph) {
          transmission(sound.graph);
          captions.add("radio");
          window.setTimeout(() => captions.delete("radio"), 3000);
        }
      }
      setView({ latest, pending, now });
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, []);

  const { latest, pending, now } = view;
  if (!latest && !pending) return null;
  return (
    <section className="panel comms-feed" aria-label={commsUi.label}>
      {latest && (
        // Messages arrive minutes apart, so a polite live region reads each one once.
        <div role="status" aria-live="polite">
          <p className="panel-kicker">{commsUi.from}</p>
          <p>{latest.text}</p>
          {latest.arriveMs - latest.eventMs > 1000 && (
            <p className="planner-note">{commsUi.roundTrip(formatDuration((latest.arriveMs - latest.eventMs) / 1000))}</p>
          )}
        </div>
      )}
      {pending && <p className="planner-note">{commsUi.inFlight(formatDuration((pending.arriveMs - now) / 1000))}</p>}
    </section>
  );
}
