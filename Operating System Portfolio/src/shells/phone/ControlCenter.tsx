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
        onLock={lock}
        onDone={() => setOverlay(null)}
        actions={
          <button onClick={() => setOverlay("switcher")} className="col-span-2 rounded-2xl bg-glass p-3 text-sm">
            Recent apps
          </button>
        }
      />
    </Sheet>
  );
}
