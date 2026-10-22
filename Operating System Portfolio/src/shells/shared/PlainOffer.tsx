"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "kbos.plain-offer-dismissed";

// navigator.deviceMemory is Chromium only and missing from the DOM types.
function isWeakDevice() {
  const cores = navigator.hardwareConcurrency ?? 8;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  return cores <= 2 || memory <= 2;
}

// Offers the plain view on devices likely to struggle with the OS chrome.
export function PlainOffer() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = window.sessionStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      // Storage blocked: offer again next load, which is harmless.
    }
    // Reading device signals has to wait for the browser.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!dismissed && isWeakDevice()) setShow(true);
  }, []);

  if (!show) return null;
  const dismiss = () => {
    setShow(false);
    try {
      window.sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
  };
  return (
    <div role="status" className="fixed inset-x-3 bottom-24 z-[10000] mx-auto flex max-w-md flex-wrap items-center gap-3 rounded-2xl border border-line bg-ink/95 p-4 text-sm shadow-2xl">
      <p className="flex-1">This device may find the full OS heavy. The plain view has everything and loads fast.</p>
      <a href="/plain" className="rounded-control bg-accent px-3 py-1.5 font-medium text-on-accent">
        Open plain view
      </a>
      <button onClick={dismiss} className="rounded-control px-3 py-1.5">
        Keep kbOS
      </button>
    </div>
  );
}
