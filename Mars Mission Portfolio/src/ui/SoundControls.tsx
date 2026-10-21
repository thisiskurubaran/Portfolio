"use client";

import { useEffect, useState } from "react";
import { captions, setSound, sound } from "@/audio/sound";
import { ui } from "@/content/ui";

/** Opt-in sound toggle with live captions of what is audible. */
export function SoundControls() {
  const [on, setOn] = useState(false);
  const [list, setList] = useState<string[]>([]);

  useEffect(() => {
    if (!on) return;
    const id = window.setInterval(() => setList([...captions]), 500);
    return () => window.clearInterval(id);
  }, [on]);

  // Suspend sound when the tab is hidden; resume only if the visitor had it on.
  useEffect(() => {
    const onVis = () => {
      const ctx = sound.graph?.ctx;
      if (!ctx || !sound.on) return;
      if (document.hidden) void ctx.suspend();
      else void ctx.resume();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  return (
    <div className="sound">
      <button
        type="button"
        className="hud-button"
        aria-pressed={on}
        title={ui.sound.note}
        onClick={() => {
          const next = !on;
          setOn(next);
          if (!next) setList([]);
          void setSound(next);
        }}
      >
        {on ? ui.sound.on : ui.sound.off}
      </button>
      {on && list.length > 0 && (
        <ul className="panel sound-captions" aria-label={ui.sound.captionsLabel}>
          {list.map((id) => (
            <li key={id}>[{ui.sound.captions[id] ?? id}]</li>
          ))}
        </ul>
      )}
    </div>
  );
}
