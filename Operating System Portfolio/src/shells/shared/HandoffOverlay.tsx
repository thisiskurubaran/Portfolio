"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { LogoMark } from "@/design/Logo";
import type { Shell } from "@/os/device/resolve";
import { shells } from "@/os/device/shells";
import { useDevice } from "@/os/device/useDevice";
import { useHandoff } from "@/os/system/handoff";
import { useReducedMotion, useWallpaper } from "@/os/system/useSystemAttributes";

// Device outlines the screen shrinks into, as a share of the viewport.
const frames: Record<Shell, { w: string; h: string; r: number }> = {
  phone: { w: "min(30vh, 46vw)", h: "62vh", r: 36 },
  pad: { w: "min(56vh, 70vw)", h: "70vh", r: 24 },
  desk: { w: "min(80vw, 120vh)", h: "min(50vw, 70vh)", r: 14 },
  vision: { w: "min(70vw, 110vh)", h: "min(40vw, 56vh)", r: 40 },
};

// The current screen shrinks into the target device's outline, the shell swaps
// underneath, then the outline grows back to fill the screen.
export function HandoffOverlay() {
  const target = useHandoff((s) => s.target);
  const finish = useHandoff((s) => s.finish);
  const { setOverride } = useDevice();
  const reduced = useReducedMotion();
  const wallpaper = useWallpaper();
  const [phase, setPhase] = useState<"in" | "out">("in");

  useEffect(() => {
    if (!target) return;
    if (reduced) {
      setOverride(target);
      finish();
      return;
    }
    // Phase changes are timed against the animation below.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPhase("in");
    const swap = window.setTimeout(() => {
      setOverride(target);
      setPhase("out");
    }, 650);
    const done = window.setTimeout(finish, 1250);
    return () => {
      window.clearTimeout(swap);
      window.clearTimeout(done);
    };
  }, [target, reduced, setOverride, finish]);

  const info = shells.find((s) => s.id === target);
  return (
    <AnimatePresence>
      {target && !reduced && (
        <motion.div
          key="handoff"
          className="fixed inset-0 z-[45000] flex items-center justify-center bg-[#07090c]/80 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          aria-live="polite"
        >
          <motion.div
            className="flex flex-col items-center justify-center gap-3 overflow-hidden border-2 border-white/30 text-[#f6f4ef] shadow-2xl"
            style={{ background: wallpaper }}
            initial={{ width: "100vw", height: "100vh", borderRadius: 0 }}
            animate={
              phase === "in"
                ? { width: frames[target].w, height: frames[target].h, borderRadius: frames[target].r }
                : { width: "100vw", height: "100vh", borderRadius: 0, opacity: 0 }
            }
            transition={{ duration: phase === "in" ? 0.55 : 0.5, ease: [0.3, 0.7, 0.2, 1] }}
          >
            <LogoMark variant="tile" size={52} />
            <p className="text-sm tracking-[0.25em]">{info?.name.toUpperCase()}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
