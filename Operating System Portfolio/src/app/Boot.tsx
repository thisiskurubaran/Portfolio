"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { Shell } from "@/os/device/resolve";
import { builtShells } from "@/os/device/shells";
import { useDevice } from "@/os/device/useDevice";

// Code-split per shell so a device never downloads another shell's code.
const shellComponents: Partial<Record<Shell, ComponentType>> = {
  desk: dynamic(() => import("@/shells/desk/KbDesk"), { ssr: false }),
  phone: dynamic(() => import("@/shells/phone/KbPhone"), { ssr: false }),
};

export function Boot() {
  const { shell } = useDevice();
  if (!shell) return null;
  const Shell = shellComponents[builtShells.includes(shell) ? shell : "desk"]!;
  return <Shell />;
}
