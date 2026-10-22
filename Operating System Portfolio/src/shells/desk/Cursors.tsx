"use client";

import { useEffect } from "react";
import { hideCursor, sendCursor, usePresence } from "@/os/system/presence";

// Each visitor gets a colour from their alias, so a cursor keeps its colour.
function colorFor(id: string) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return `hsl(${h} 70% 65%)`;
}

// F26: other visitors' pointers on kbDesk. Positions are fractions of the
// screen, so they land in the same place whatever the window size.
export function Cursors() {
  const cursors = usePresence((s) => s.cursors);
  const connected = usePresence((s) => s.connected);

  useEffect(() => {
    if (!connected) return;
    const move = (e: PointerEvent) => sendCursor(e.clientX / window.innerWidth, e.clientY / window.innerHeight);
    const leave = () => hideCursor();
    window.addEventListener("pointermove", move);
    document.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
    };
  }, [connected]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[13000]">
      {Object.entries(cursors).map(([id, c]) => (
        <svg
          key={id}
          width="18"
          height="18"
          viewBox="0 0 18 18"
          className="absolute transition-transform duration-75 ease-linear"
          style={{ transform: `translate(${c.x * 100}vw, ${c.y * 100}vh)`, left: 0, top: 0 }}
        >
          <path d="M2 2l12 5-5 2-2 5z" fill={colorFor(id)} stroke="#0e1116" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
      ))}
    </div>
  );
}

export function OnlineCount() {
  const count = usePresence((s) => s.count);
  const connected = usePresence((s) => s.connected);
  if (!connected || count < 1) return null;
  return (
    <span className="flex items-center gap-1.5 text-xs opacity-80" title="Visitors here right now">
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />
      {count} online
    </span>
  );
}
