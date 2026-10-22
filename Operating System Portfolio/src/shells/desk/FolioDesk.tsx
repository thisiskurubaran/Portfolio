"use client";

import { useEffect } from "react";
import { useWindows } from "@/os/state/windows";
import { registerLauncher } from "@/os/system/launcher";
import { useWallpaper } from "@/os/system/useSystemAttributes";
import { Launchpad } from "@/shells/shared/Launchpad";
import { Spotlight } from "@/shells/shared/Spotlight";
import { DeskWindow } from "./DeskWindow";
import { Dock } from "./Dock";
import { MenuBar } from "./MenuBar";
import { MissionControl } from "./MissionControl";
import { LoginScreen } from "./LoginScreen";
import { NotificationCenter } from "./NotificationCenter";
import { QuickPanel } from "./QuickPanel";
import { SystemMenu } from "./SystemMenu";
import { Cursors } from "./Cursors";
import { useDesk } from "./state";
import { StickyComposer, StickyLayer } from "./Stickies";

const MENU_BAR = 30;

// Restored windows may come from a bigger screen; pull them back into view.
function clampRestoredWindows() {
  const { windows, setRect } = useWindows.getState();
  for (const w of windows) {
    const width = Math.min(w.width, window.innerWidth);
    const height = Math.min(w.height, window.innerHeight - MENU_BAR - 40);
    const x = Math.min(Math.max(0, w.x), window.innerWidth - Math.min(width, 120));
    const y = Math.min(Math.max(MENU_BAR, w.y), window.innerHeight - 80);
    if (width !== w.width || height !== w.height || x !== w.x || y !== w.y) setRect(w.id, { x, y, width, height });
  }
}

export default function FolioDesk() {
  const windows = useWindows((s) => s.windows);
  const focusedId = useWindows((s) => s.focusedId);
  const overlay = useDesk((s) => s.overlay);
  const loggedIn = useDesk((s) => s.loggedIn);
  const wallpaper = useWallpaper();

  useEffect(() => {
    // Overlays left open before a handoff should not greet the visitor on return.
    useDesk.getState().setOverlay(null);
    clampRestoredWindows();
    // About is the first thing shown after boot.
    if (useWindows.getState().windows.length === 0) useWindows.getState().open("about");
    return registerLauncher((id) => {
      useDesk.getState().setOverlay(null);
      useWindows.getState().open(id);
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && (e.code === "Space" || e.key.toLowerCase() === "k")) {
        e.preventDefault();
        useDesk.getState().toggle("spotlight");
      } else if ((e.ctrlKey && e.key === "ArrowUp") || e.key === "F3") {
        e.preventDefault();
        useDesk.getState().toggle("overview");
      } else if (e.key === "F4" || (mod && e.shiftKey && e.key.toLowerCase() === "a")) {
        e.preventDefault();
        useDesk.getState().toggle("launcher");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: wallpaper }}>
      <StickyLayer />
      <MenuBar />
      {windows.map((win) => (
        <DeskWindow key={win.id} win={win} focused={win.id === focusedId} />
      ))}
      <Dock />
      {overlay === "spotlight" && <Spotlight onClose={() => useDesk.getState().setOverlay(null)} />}
      {overlay === "overview" && <MissionControl />}
      {overlay === "launcher" && <Launchpad onClose={() => useDesk.getState().setOverlay(null)} />}
      {overlay === "center" && <NotificationCenter />}
      {overlay === "control" && <QuickPanel />}
      {overlay === "sticky" && <StickyComposer />}
      <Cursors />
      {overlay === "menu" && <SystemMenu onLogout={() => useDesk.getState().setLoggedIn(false)} />}
      {!loggedIn && <LoginScreen onLogin={() => useDesk.getState().setLoggedIn(true)} />}
    </div>
  );
}
