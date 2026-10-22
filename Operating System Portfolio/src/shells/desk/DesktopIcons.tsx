"use client";

import { useState } from "react";
import { AppIcon } from "@/design/AppIcon";
import type { IconName } from "@/design/icons";
import type { AppId } from "@/os/apps/registry";
import { launch } from "@/os/system/launcher";
import { leaveTo } from "@/os/system/navigate";
import { useDesk } from "./state";

interface Shortcut {
  id: string;
  label: string;
  icon: IconName;
  tile: string;
  open: () => void;
}

const app = (id: AppId, label: string, icon: IconName, tile: string = id): Shortcut => ({ id, label, icon, tile, open: () => launch(id) });

const shortcuts: Shortcut[] = [
  app("about", "About me", "about"),
  app("resume", "Resume.pdf", "resume"),
  app("projects", "Projects", "projects"),
  app("guestbook", "Guestbook", "guestbook"),
  { id: "plain", label: "Plain view", icon: "notes", tile: "editor", open: () => leaveTo("/plain") },
];

// F16: shortcuts on the desktop. Click selects, double click or Enter opens,
// right click offers Open.
export function DesktopIcons() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <nav aria-label="Desktop" className="absolute right-4 top-12 flex flex-col gap-2" onClick={(e) => e.target === e.currentTarget && setSelected(null)}>
      {shortcuts.map((s) => (
        <button
          key={s.id}
          onClick={() => setSelected(s.id)}
          onDoubleClick={s.open}
          onKeyDown={(e) => e.key === "Enter" && s.open()}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setSelected(s.id);
            useDesk.getState().openMenu({ x: e.clientX, y: e.clientY, label: s.label, items: [{ label: "Open", onSelect: s.open }] });
          }}
          className={`flex w-[84px] flex-col items-center gap-1 rounded-lg p-1.5 text-center ${selected === s.id ? "bg-glass-strong" : ""}`}
        >
          <AppIcon id={s.tile} icon={s.icon} size={44} />
          <span className={`rounded px-1 text-[11px] font-medium leading-tight [text-shadow:0_1px_2px_rgb(0_0_0/0.35)] ${selected === s.id ? "bg-accent text-on-accent [text-shadow:none]" : ""}`}>
            {s.label}
          </span>
        </button>
      ))}
    </nav>
  );
}
