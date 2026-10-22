"use client";

import { useEffect } from "react";
import { desktopOf, DESKTOPS, useWindows } from "@/os/state/windows";
import { registerLauncher } from "@/os/system/launcher";
import { useWallpaper } from "@/os/system/useSystemAttributes";
import { Launchpad } from "@/shells/shared/Launchpad";
import { Menu } from "@/shells/shared/Menu";
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
import { DesktopIcons } from "./DesktopIcons";
import { desktopMenu } from "./menus";
import { MENU_BAR, snapRect } from "./snap";
import { useDesk } from "./state";
import { StickyComposer, StickyLayer } from "./Stickies";

// Restored windows may come from a bigger screen; pull them back into view.
// A hidden tab can report a zero-size viewport, so very small sizes are
// ignored, and windows never shrink below the usable minimum.
function clampRestoredWindows() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (vw < 400 || vh < 300) return;
  const { windows, setRect } = useWindows.getState();
  for (const w of windows) {
    const width = Math.max(320, Math.min(w.width, vw));
    const height = Math.max(220, Math.min(w.height, vh - MENU_BAR - 40));
    const x = Math.min(Math.max(0, w.x), vw - Math.min(width, 120));
    const y = Math.min(Math.max(MENU_BAR, w.y), vh - 80);
    if (width !== w.width || height !== w.height || x !== w.x || y !== w.y) setRect(w.id, { x, y, width, height });
  }
}

export default function FolioDesk() {
  const allWindows = useWindows((s) => s.windows);
  const currentDesktop = useWindows((s) => s.currentDesktop);
  const windows = allWindows.filter((w) => desktopOf(w) === currentDesktop);
  const focusedId = useWindows((s) => s.focusedId);
  const overlay = useDesk((s) => s.overlay);
  const loggedIn = useDesk((s) => s.loggedIn);
  const menu = useDesk((s) => s.menu);
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
      } else if (e.ctrlKey && e.altKey && e.key.startsWith("Arrow")) {
        // F18: keyboard snapping for the focused window.
        const { windows: all, focusedId, setRect, toggleMaximize } = useWindows.getState();
        const win = all.find((w) => w.id === focusedId);
        if (!win) return;
        e.preventDefault();
        if (e.key === "ArrowLeft") setRect(win.id, snapRect("left"));
        else if (e.key === "ArrowRight") setRect(win.id, snapRect("right"));
        else if (e.key === "ArrowUp") setRect(win.id, snapRect("fill"));
        else if (win.maximized) toggleMaximize(win.id);
        else setRect(win.id, { x: Math.round((window.innerWidth - 720) / 2), y: 80, width: 720, height: 480 });
      } else if (e.altKey && !e.ctrlKey && !e.metaKey && /^Digit[1-9]$/.test(e.code)) {
        // F19: Alt+1, Alt+2, Alt+3 switch desktops, unless the visitor is typing.
        const n = Number(e.code.slice(5));
        const typing = (e.target as HTMLElement).closest("input, textarea, [contenteditable]");
        if (typing || n > DESKTOPS) return;
        e.preventDefault();
        useWindows.getState().setDesktop(n);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ background: wallpaper }}
      onContextMenu={(e) => {
        // Only the bare desktop gets the desktop menu; windows and the dock have their own.
        if (e.target !== e.currentTarget) return;
        e.preventDefault();
        useDesk.getState().openMenu({ x: e.clientX, y: e.clientY, label: "Desktop", items: desktopMenu() });
      }}
    >
      <StickyLayer />
      <DesktopIcons />
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
      {menu && <Menu {...menu} onClose={() => useDesk.getState().closeMenu()} />}
      {!loggedIn && <LoginScreen onLogin={() => useDesk.getState().setLoggedIn(true)} />}
    </div>
  );
}
