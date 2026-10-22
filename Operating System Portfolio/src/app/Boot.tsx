"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { Shell } from "@/os/device/resolve";
import { builtShells } from "@/os/device/shells";
import { useDevice } from "@/os/device/useDevice";
import { useSystemAttributes } from "@/os/system/useSystemAttributes";
import { PlainOffer } from "@/shells/shared/PlainOffer";

// Code-split per shell so a device never downloads another shell's code.
const shellComponents: Partial<Record<Shell, ComponentType>> = {
  desk: dynamic(() => import("@/shells/desk/KbDesk"), { ssr: false }),
  phone: dynamic(() => import("@/shells/phone/KbPhone"), { ssr: false }),
  pad: dynamic(() => import("@/shells/pad/KbPad"), { ssr: false }),
};

export function Boot() {
  const { shell } = useDevice();
  useSystemAttributes();
  if (!shell) return null;
  const Shell = shellComponents[builtShells.includes(shell) ? shell : "desk"]!;
  return (
    <>
      <Shell />
      <PlainOffer />
    </>
  );
}
