"use client";

import { useEffect } from "react";
import { registerLauncher } from "@/os/system/launcher";
import { useWallpaper } from "@/os/system/useSystemAttributes";
import { Spotlight } from "@/shells/shared/Spotlight";
import { AppSwitcher } from "./AppSwitcher";
import { AppView } from "./AppView";
import { ControlCenter } from "./ControlCenter";
import { HomeScreen } from "./HomeScreen";
import { LockScreen } from "./LockScreen";
import { NotificationShade } from "./NotificationShade";
import { StatusBar } from "./StatusBar";
import { usePhone } from "./state";

// The real mobile shell: full screen apps and gestures, no windows.
export default function KbPhone() {
  const { locked, app, overlay } = usePhone();
  const wallpaper = useWallpaper();

  useEffect(
    () =>
      registerLauncher((id) => {
        usePhone.getState().unlock();
        usePhone.getState().openApp(id);
      }),
    [],
  );

  return (
    <main className="relative flex h-dvh w-screen select-none flex-col overflow-hidden" style={{ background: wallpaper }}>
      <StatusBar />
      {locked ? <LockScreen /> : <HomeScreen />}
      {!locked && app && <AppView id={app} />}
      {overlay === "control" && <ControlCenter />}
      {overlay === "shade" && <NotificationShade />}
      {overlay === "switcher" && <AppSwitcher />}
      {overlay === "search" && <Spotlight fullScreen onClose={() => usePhone.getState().setOverlay(null)} />}
    </main>
  );
}
