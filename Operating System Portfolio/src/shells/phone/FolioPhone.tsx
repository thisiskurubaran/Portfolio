"use client";

import { useEffect } from "react";
import { registerLauncher } from "@/os/system/launcher";
import { useWallpaper } from "@/os/system/useSystemAttributes";
import { LockScreen } from "@/shells/shared/LockScreen";
import { Launchpad } from "@/shells/shared/Launchpad";
import { Spotlight } from "@/shells/shared/Spotlight";
import { TouchControlCenter } from "@/shells/shared/TouchControlCenter";
import { TouchNotificationCenter } from "@/shells/shared/TouchNotificationCenter";
import { AppSwitcher } from "./AppSwitcher";
import { AppView } from "./AppView";
import { GestureHints } from "./GestureHints";
import { HomeScreen } from "./HomeScreen";
import { StatusBar } from "./StatusBar";
import { usePhone } from "./state";

// The real mobile shell: full screen apps and gestures, no windows.
export default function FolioPhone() {
  const { locked, app, overlay } = usePhone();
  const wallpaper = useWallpaper();
  const close = () => usePhone.getState().setOverlay(null);

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
      <StatusBar onApp={!!app && !locked} />
      {locked ? <LockScreen onUnlock={() => usePhone.getState().unlock()} /> : <HomeScreen />}
      {!locked && app && <AppView id={app} />}
      {!locked && !app && !overlay && <GestureHints />}
      {overlay === "control" && (
        <TouchControlCenter onClose={close} onLock={() => usePhone.getState().lock()} onRecents={() => usePhone.getState().setOverlay("switcher")} />
      )}
      {overlay === "shade" && <TouchNotificationCenter onClose={close} />}
      {overlay === "switcher" && <AppSwitcher />}
      {overlay === "launcher" && <Launchpad columns={4} title="App Library" onClose={close} />}
      {overlay === "search" && <Spotlight fullScreen onClose={close} />}
    </main>
  );
}
