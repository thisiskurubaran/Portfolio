"use client";

import dynamic from "next/dynamic";
import { useDevice } from "@/os/device/useDevice";

// Code-split per shell so a device never downloads another shell's code.
const KbDesk = dynamic(() => import("@/shells/desk/KbDesk"), { ssr: false });

export function Boot() {
  const { shell } = useDevice();
  if (!shell) return null;
  // Only kbDesk exists so far. The other shells arrive in later milestones.
  return <KbDesk />;
}
