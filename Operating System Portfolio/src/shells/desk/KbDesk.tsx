"use client";

import { useEffect } from "react";
import { useWindows } from "@/os/state/windows";
import { Dock } from "./Dock";
import { MenuBar } from "./MenuBar";
import { DeskWindow } from "./DeskWindow";

export default function KbDesk() {
  const windows = useWindows((s) => s.windows);
  const focusedId = useWindows((s) => s.focusedId);

  // About is the first thing shown after boot.
  useEffect(() => {
    if (useWindows.getState().windows.length === 0) useWindows.getState().open("about");
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gradient-to-br from-[#10202b] via-ink to-[#1b1a2e]">
      <MenuBar />
      {windows.map((win) => (
        <DeskWindow key={win.id} win={win} focused={win.id === focusedId} />
      ))}
      <Dock />
    </div>
  );
}
