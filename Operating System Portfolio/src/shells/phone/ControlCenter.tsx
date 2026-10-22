"use client";

import { QuickSettings } from "@/shells/shared/QuickSettings";
import { Sheet } from "@/shells/shared/Sheet";
import { usePhone } from "./state";

export function ControlCenter() {
  const setOverlay = usePhone((s) => s.setOverlay);
  const lock = usePhone((s) => s.lock);
  return (
    <Sheet label="Control center" onClose={() => setOverlay(null)}>
      <QuickSettings
        actions={
          <>
            <button onClick={() => setOverlay("switcher")} className="rounded-2xl bg-glass p-3 text-sm">
              Recent apps
            </button>
            <button onClick={lock} className="rounded-2xl bg-glass p-3 text-sm">
              Lock
            </button>
          </>
        }
      />
    </Sheet>
  );
}
