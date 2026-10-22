const BOOTED_KEY = "folioos.booted";

function readBooted() {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(BOOTED_KEY) === "1";
  } catch {
    return false;
  }
}

// The boot sequence, guest login and lock screen only greet a first visit.
// Repeat visitors go straight to their shell, so nothing blocks the content.
export const firstVisit = !readBooted();

export function markBooted() {
  try {
    window.localStorage.setItem(BOOTED_KEY, "1");
  } catch {
    // Blocked storage: the visitor sees the boot again next time, which is harmless.
  }
}
