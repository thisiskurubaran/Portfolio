"use client";

import { useEffect } from "react";
import { registerLauncher } from "@/os/system/launcher";
import { useWallpaper } from "@/os/system/useSystemAttributes";
import { LockScreen } from "@/shells/shared/LockScreen";
import { Launchpad } from "@/shells/shared/Launchpad";
import { Spotlight } from "@/shells/shared/Spotlight";
import { AppSwitcher } from "./AppSwitcher";
import { AppView } from "./AppView";
import { ControlCenter } from "./ControlCenter";
import { HomeScreen } from "./HomeScreen";
import { NotificationShade } from "./NotificationShade";
import { StatusBar } from "./StatusBar";
import { usePhone } from "./state";

// The real mobile shell: full screen apps and gestures, no windows.
export default function FolioPhone() {
  const { locked, app, overlay } = usePhone();
  const wallpaper = useWallpaper();

  useEffect(() => {
    // Overlays left open before a handoff should not greet the visitor on return.
    usePhone.getState().setOverlay(null);
    return registerLauncher((id) => {
      usePhone.getState().unlock();
      usePhone.getState().openApp(id);
    });
  }, []);

  return (
    <main className="relative flex h-full w-full select-none flex-col overflow-hidden" style={{ background: wallpaper }}>
      <StatusBar />
      {locked ? <LockScreen onUnlock={() => usePhone.getState().unlock()} /> : <HomeScreen />}
      {!locked && app && <AppView id={app} />}
      {overlay === "control" && <ControlCenter />}
      {overlay === "shade" && <NotificationShade />}
      {overlay === "switcher" && <AppSwitcher />}
      {overlay === "launcher" && <Launchpad columns={4} title="App Library" onClose={() => usePhone.getState().setOverlay(null)} />}
      {overlay === "search" && <Spotlight fullScreen onClose={() => usePhone.getState().setOverlay(null)} />}
    </main>
  );
}
