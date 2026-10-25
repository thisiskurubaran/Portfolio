"use client";

import { useSwipe } from "@/shells/shared/useSwipe";
import { PadPane } from "./PadPane";
import { usePad } from "./state";

// A narrow app floating over the others. Swipe it right to tuck it away, and
// pull the tab at the edge to bring it back.
export function SlideOver() {
  const { slide, slideHidden, setSlideHidden } = usePad();
  const swipe = useSwipe((dir) => {
    if (dir === "right") setSlideHidden(true);
    if (dir === "left") setSlideHidden(false);
  });
  if (!slide) return null;
  if (slideHidden) {
    return (
      <button
        {...swipe}
        onClick={() => setSlideHidden(false)}
        aria-label="Show slide-over"
        className="absolute right-0 top-1/2 z-30 h-24 w-5 -translate-y-1/2 touch-none mat-thin rounded-l-2xl"
      >
        <span aria-hidden className="mx-auto block h-10 w-1 rounded-full bg-paper/50" />
      </button>
    );
  }
  return (
    <div className="folio-fade-in absolute bottom-10 right-4 top-12 z-30 flex w-[min(380px,40vw)] flex-col rounded-[26px] shadow-[0_24px_60px_rgb(0_0_0/0.45)]">
      <div className="min-h-0 flex-1">
        <PadPane id={slide} pane="slide" compact />
      </div>
      <div className="flex shrink-0 items-center justify-center gap-3 pt-2">
        <span {...swipe} aria-hidden className="flex h-5 w-28 touch-none items-center justify-center">
          <span className="h-[5px] w-24 rounded-full bg-paper/70" />
        </span>
        <button onClick={() => setSlideHidden(true)} className="mat-thin rounded-full px-3 py-1 text-[11px] font-medium">
          Tuck away
        </button>
      </div>
    </div>
  );
}
