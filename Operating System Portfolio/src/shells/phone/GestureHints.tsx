"use client";

import { useState } from "react";
import { Icon, type IconName } from "@/design/icons";

const KEY = "folioos.phone-hints";

const hints: { icon: IconName; text: string }[] = [
  { icon: "chevron", text: "Swipe up on the bar at the bottom of an app to go home. Swipe further for recent apps." },
  { icon: "bell", text: "Pull down from the top left for notifications, top right for the control center." },
  { icon: "launcher", text: "Swipe left on the home screen for every app." },
];

function seen() {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return true;
  }
}

// First-run gesture hints for folioPhone. Shown once, dismissed with one tap.
export function GestureHints() {
  const [show, setShow] = useState(() => !seen());
  if (!show) return null;
  const done = () => {
    setShow(false);
    try {
      window.localStorage.setItem(KEY, "1");
    } catch {
      // ignore
    }
  };
  return (
    <div role="dialog" aria-label="Gestures" className="absolute inset-x-4 bottom-6 z-30 rounded-sheet border border-line bg-surface/90 p-4 shadow-3 backdrop-blur-2xl">
      <p className="mb-3 font-display text-base font-semibold">A few gestures</p>
      <ul className="space-y-2.5 text-sm">
        {hints.map((h) => (
          <li key={h.text} className="flex gap-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent-fg">
              <Icon name={h.icon} size={15} className={h.icon === "chevron" ? "-rotate-90" : ""} />
            </span>
            {h.text}
          </li>
        ))}
      </ul>
      <button onClick={done} className="mt-4 w-full rounded-control bg-accent py-2 text-sm font-medium text-on-accent">
        Got it
      </button>
    </div>
  );
}
