"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import type { Shell } from "@/os/device/resolve";

// Natural sizes in CSS pixels. The tablet sits in landscape on a wide screen.
const devices: Partial<Record<Shell, { w: number; h: number; radius: number; minViewport: number }>> = {
  phone: { w: 390, h: 844, radius: 44, minViewport: 700 },
  pad: { w: 1180, h: 820, radius: 28, minViewport: 1300 },
};

function subscribe(cb: () => void) {
  window.addEventListener("resize", cb);
  return () => window.removeEventListener("resize", cb);
}
const viewportWidth = () => window.innerWidth;

// When a touch shell runs on a screen far bigger than the device (after a
// handoff from folioDesk), it is shown at device size in a frame. The transform
// makes the frame the containing block, so fixed overlays stay inside it.
export function DeviceFrame({ shell, children }: { shell: Shell; children: ReactNode }) {
  const width = useSyncExternalStore(subscribe, viewportWidth, () => 0);
  const device = devices[shell];
  if (!device || width < device.minViewport) return <div className="h-dvh w-screen">{children}</div>;
  return (
    <div className="flex h-dvh w-screen items-center justify-center bg-[#05070a] p-6">
      <div
        className="relative overflow-hidden border-[10px] border-[#1b1e24] shadow-2xl"
        style={{
          aspectRatio: `${device.w} / ${device.h}`,
          height: `min(${device.h}px, calc(100dvh - 48px), calc((100vw - 48px) * ${device.h / device.w}))`,
          borderRadius: device.radius,
          transform: "translateZ(0)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
