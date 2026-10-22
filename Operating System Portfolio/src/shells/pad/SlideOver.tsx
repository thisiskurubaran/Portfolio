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
        className="absolute right-0 top-1/2 z-30 h-24 w-5 -translate-y-1/2 touch-none rounded-l-xl border border-r-0 border-line bg-ink/80 backdrop-blur-xl"
      >
        <span aria-hidden className="mx-auto block h-10 w-1 rounded-full bg-paper/50" />
      </button>
    );
  }
  return (
    <div className="absolute bottom-10 right-3 top-12 z-30 flex w-[min(380px,40vw)] flex-col shadow-2xl">
      <div {...swipe} className="flex h-5 shrink-0 touch-none items-center justify-center" aria-hidden>
        <span className="h-1 w-10 rounded-full bg-paper/50" />
      </div>
      <div className="min-h-0 flex-1">
        <PadPane id={slide} pane="slide" compact />
      </div>
      <button onClick={() => setSlideHidden(true)} className="mt-1 text-xs opacity-70">
        Tuck away
      </button>
    </div>
  );
}
