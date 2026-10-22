"use client";

import { Icon, type IconName } from "@/design/icons";
import { useSystem } from "@/os/system/systemState";

// F20: lock, sleep, restart and shut down, the same four in every shell.
// Lock is the shell's own (login on folioDesk, lock screen on touch shells).
export function PowerRow({ onLock, onDone }: { onLock: () => void; onDone?: () => void }) {
  const { sleep, restart, shutDown } = useSystem();
  const actions: { label: string; icon: IconName; run: () => void }[] = [
    { label: "Lock", icon: "lock", run: onLock },
    { label: "Sleep", icon: "moon", run: sleep },
    { label: "Restart", icon: "restart", run: restart },
    { label: "Shut down", icon: "power", run: shutDown },
  ];
  return (
    <div role="group" aria-label="Power" className="grid grid-cols-4 gap-2">
      {actions.map((a) => (
        <button
          key={a.label}
          onClick={() => {
            onDone?.();
            a.run();
          }}
          className="flex flex-col items-center gap-1 rounded-2xl bg-glass p-2.5 text-xs hover:bg-glass-strong"
        >
          <Icon name={a.icon} size={18} />
          {a.label}
        </button>
      ))}
    </div>
  );
}
