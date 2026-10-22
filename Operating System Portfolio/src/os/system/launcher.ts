import type { AppId } from "@/os/apps/registry";

// Apps, spotlight and system features open things without knowing which shell
// is running. The active shell registers how it opens an app.
type Opener = (id: AppId) => void;

let opener: Opener | null = null;

export function registerLauncher(fn: Opener) {
  opener = fn;
  return () => {
    if (opener === fn) opener = null;
  };
}

export function launch(id: AppId, anchor?: string) {
  opener?.(id);
  if (anchor) reveal(anchor);
}

export const anchorId = (anchor: string) => `kb-${anchor}`;

// The app loads lazily, so wait for the element before scrolling to it.
export function reveal(anchor: string, timeoutMs = 2000) {
  const started = performance.now();
  const tryReveal = () => {
    const el = document.getElementById(anchorId(anchor));
    if (el) {
      el.scrollIntoView({ block: "center" });
      el.classList.add("kb-flash");
      window.setTimeout(() => el.classList.remove("kb-flash"), 1600);
    } else if (performance.now() - started < timeoutMs) {
      requestAnimationFrame(tryReveal);
    }
  };
  requestAnimationFrame(tryReveal);
}
