"use client";

import { useState } from "react";
import { contactLinks } from "@/content/contact";
import { ui } from "@/content/ui";

/** Contact links, reachable from any phase once the ship is flying. */
export function Comms() {
  const [open, setOpen] = useState(false);
  return (
    <div className="comms">
      <button type="button" className="hud-button" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {open ? ui.comms.close : ui.comms.open}
      </button>
      {open && (
        <ul className="panel comms-list" aria-label={ui.comms.label}>
          {contactLinks.map((c) => (
            <li key={c.label}>
              <a href={c.url} target="_blank" rel="noopener noreferrer">
                <span className="hud-key">{c.label}</span> {c.handle}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
