"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react";
import { canRunVision } from "@/os/device/capabilities";
import type { Shell } from "@/os/device/resolve";
import { builtShells, shells } from "@/os/device/shells";
import { useDevice } from "@/os/device/useDevice";
import { firstVisit, markBooted } from "@/os/system/session";
import { useSystemAttributes } from "@/os/system/useSystemAttributes";
import { useNotifications } from "@/os/state/notifications";
import { useConsoleGreeting } from "@/os/system/greeting";
import { usePresenceConnection } from "@/os/system/presence";
import { useKonami, useLanguageHello, useLowPowerProbe, useRecruiterShortcut } from "@/os/system/reactions";
import { useVisionInvite } from "@/os/system/visionInvite";
import { useWelcome } from "@/os/system/welcome";
import { BootScreen } from "@/shells/shared/BootScreen";
import { DeviceFrame } from "@/shells/shared/DeviceFrame";
import { HandoffOverlay } from "@/shells/shared/HandoffOverlay";
import { PlainOffer } from "@/shells/shared/PlainOffer";
import { ShellLoader } from "@/shells/shared/ShellLoader";
import { Screensaver } from "@/shells/shared/Screensaver";
import { Toasts } from "@/shells/shared/Toasts";

// Code-split per shell so a device never downloads another shell's code.
const shellComponents: Partial<Record<Shell, ComponentType>> = {
  desk: dynamic(() => import("@/shells/desk/KbDesk"), { ssr: false, loading: ShellLoader }),
  phone: dynamic(() => import("@/shells/phone/KbPhone"), { ssr: false, loading: ShellLoader }),
  pad: dynamic(() => import("@/shells/pad/KbPad"), { ssr: false, loading: ShellLoader }),
  // Three.js and React Three Fiber only load when kbVision is entered.
  vision: dynamic(() => import("@/shells/vision/KbVision"), { ssr: false, loading: ShellLoader }),
};

export function Boot() {
  const { shell, setOverride } = useDevice();
  useSystemAttributes();
  useConsoleGreeting();
  const [booting, setBooting] = useState(firstVisit);
  const doneBooting = useCallback(() => {
    markBooted();
    setBooting(false);
  }, []);
  // kbVision falls back to kbDesk when WebGL is missing or the device is weak.
  const visionCheck = useMemo(() => (shell === "vision" ? canRunVision() : null), [shell]);
  const active: Shell | null = !shell ? null : visionCheck && !visionCheck.ok ? "desk" : builtShells.includes(shell) ? shell : "desk";
  useEffect(() => {
    if (visionCheck && !visionCheck.ok) {
      setOverride(null);
      useNotifications.getState().push("kbVision is not available here", { body: visionCheck.reason });
    }
  }, [visionCheck, setOverride]);
  useWelcome(booting ? null : active);
  useVisionInvite(booting ? null : active);
  usePresenceConnection(!booting && active !== null);
  const ready = !booting && active !== null;
  useKonami(ready);
  useRecruiterShortcut(ready);
  useLanguageHello(ready);
  useLowPowerProbe(ready);
  if (!active) return null;
  const Shell = shellComponents[active]!;
  return (
    <>
      {booting && <BootScreen shellName={shells.find((s) => s.id === active)!.name} onDone={doneBooting} />}
      <DeviceFrame shell={active}>
        <Shell />
        <Toasts />
      </DeviceFrame>
      <HandoffOverlay />
      <Screensaver />
      <PlainOffer />
    </>
  );
}
