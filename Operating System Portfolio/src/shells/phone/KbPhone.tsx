"use client";

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
  return (
    <main className="relative flex h-dvh w-screen select-none flex-col overflow-hidden bg-gradient-to-b from-[#123040] via-ink to-[#21193a]">
      <StatusBar />
      {locked ? <LockScreen /> : <HomeScreen />}
      {!locked && app && <AppView id={app} />}
      {overlay === "control" && <ControlCenter />}
      {overlay === "shade" && <NotificationShade />}
    </main>
  );
}
