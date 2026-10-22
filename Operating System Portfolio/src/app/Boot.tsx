"use client";

import dynamic from "next/dynamic";
import { useCallback, useState, type ComponentType } from "react";
import type { Shell } from "@/os/device/resolve";
import { builtShells, shells } from "@/os/device/shells";
import { useDevice } from "@/os/device/useDevice";
import { firstVisit, markBooted } from "@/os/system/session";
import { useSystemAttributes } from "@/os/system/useSystemAttributes";
import { useWelcome } from "@/os/system/welcome";
import { BootScreen } from "@/shells/shared/BootScreen";
import { DeviceFrame } from "@/shells/shared/DeviceFrame";
import { HandoffOverlay } from "@/shells/shared/HandoffOverlay";
import { PlainOffer } from "@/shells/shared/PlainOffer";
import { Toasts } from "@/shells/shared/Toasts";

// Code-split per shell so a device never downloads another shell's code.
const shellComponents: Partial<Record<Shell, ComponentType>> = {
  desk: dynamic(() => import("@/shells/desk/KbDesk"), { ssr: false }),
  phone: dynamic(() => import("@/shells/phone/KbPhone"), { ssr: false }),
  pad: dynamic(() => import("@/shells/pad/KbPad"), { ssr: false }),
};

export function Boot() {
  const { shell } = useDevice();
  useSystemAttributes();
  const [booting, setBooting] = useState(firstVisit);
  const doneBooting = useCallback(() => {
    markBooted();
    setBooting(false);
  }, []);
  useWelcome(booting ? null : shell);
  if (!shell) return null;
  const active = builtShells.includes(shell) ? shell : "desk";
  const Shell = shellComponents[active]!;
  return (
    <>
      {booting && <BootScreen shellName={shells.find((s) => s.id === active)!.name} onDone={doneBooting} />}
      <DeviceFrame shell={active}>
        <Shell />
        <Toasts />
      </DeviceFrame>
      <HandoffOverlay />
      <PlainOffer />
    </>
  );
}
