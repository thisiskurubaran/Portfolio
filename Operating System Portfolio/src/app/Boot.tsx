"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, type ComponentType } from "react";
import { canRunVision } from "@/os/device/capabilities";
import type { Shell } from "@/os/device/resolve";
import { builtShells, shells } from "@/os/device/shells";
import { useDevice } from "@/os/device/useDevice";
import { useSystemAttributes } from "@/os/system/useSystemAttributes";
import { useNotifications } from "@/os/state/notifications";
import { useConsoleGreeting } from "@/os/system/greeting";
import { usePresenceConnection } from "@/os/system/presence";
import { useKonami, useLanguageHello, useLowPowerProbe, useRecruiterShortcut } from "@/os/system/reactions";
import { listenForInstall } from "@/os/system/install";
import { openDeepLink } from "@/os/system/share";
import { useShortcutsSheet } from "@/os/system/shortcuts";
import { useSystem } from "@/os/system/systemState";
import { useVisionInvite } from "@/os/system/visionInvite";
import { useWelcome } from "@/os/system/welcome";
import { BootScreen } from "@/shells/shared/BootScreen";
import { DeviceFrame } from "@/shells/shared/DeviceFrame";
import { HandoffOverlay } from "@/shells/shared/HandoffOverlay";
import { PlainOffer } from "@/shells/shared/PlainOffer";
import { ShellLoader } from "@/shells/shared/ShellLoader";
import { Screensaver } from "@/shells/shared/Screensaver";
import { Announcer, ScreenFilters } from "@/shells/shared/ScreenLayers";
import { ShortcutsSheet } from "@/shells/shared/ShortcutsSheet";
import { ShutDownScreen } from "@/shells/shared/ShutDownScreen";
import { Toasts } from "@/shells/shared/Toasts";

// Code-split per shell so a device never downloads another shell's code.
const shellComponents: Partial<Record<Shell, ComponentType>> = {
  desk: dynamic(() => import("@/shells/desk/FolioDesk"), { ssr: false, loading: ShellLoader }),
  phone: dynamic(() => import("@/shells/phone/FolioPhone"), { ssr: false, loading: ShellLoader }),
  pad: dynamic(() => import("@/shells/pad/FolioPad"), { ssr: false, loading: ShellLoader }),
  // Three.js and React Three Fiber only load when folioVision is entered.
  vision: dynamic(() => import("@/shells/vision/FolioVision"), { ssr: false, loading: ShellLoader }),
};

export function Boot() {
  const { shell, setOverride } = useDevice();
  useSystemAttributes();
  useConsoleGreeting();
  const phase = useSystem((s) => s.phase);
  const finishBoot = useSystem((s) => s.finishBoot);
  const booting = phase === "booting";
  // folioVision falls back to folioDesk when WebGL is missing or the device is weak.
  const visionCheck = useMemo(() => (shell === "vision" ? canRunVision() : null), [shell]);
  const active: Shell | null = !shell ? null : visionCheck && !visionCheck.ok ? "desk" : builtShells.includes(shell) ? shell : "desk";
  useEffect(() => {
    if (visionCheck && !visionCheck.ok) {
      setOverride(null);
      useNotifications.getState().push("folioVision is not available here", { body: visionCheck.reason });
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
  const shortcutsOpen = useShortcutsSheet((s) => s.open);
  useEffect(() => {
    if (!ready) return;
    listenForInstall();
    openDeepLink();
  }, [ready]);
  useEffect(() => {
    // F21: Ctrl / shows the shortcuts sheet in every shell.
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        useShortcutsSheet.getState().setOpen(!useShortcutsSheet.getState().open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  if (!active) return null;
  const Shell = shellComponents[active]!;
  return (
    <>
      {booting && <BootScreen shellName={shells.find((s) => s.id === active)!.name} onDone={finishBoot} />}
      {phase === "off" && <ShutDownScreen />}
      <DeviceFrame shell={active}>
        <Shell />
        <Toasts />
      </DeviceFrame>
      <HandoffOverlay />
      <Screensaver />
      {shortcutsOpen && <ShortcutsSheet />}
      <ScreenFilters />
      <Announcer />
      <PlainOffer />
    </>
  );
}
