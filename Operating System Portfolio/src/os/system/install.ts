"use client";

import { create } from "zustand";

interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// F33: folioOS installs as an app. Chromium browsers hand us an install
// prompt to show on request; others install from their own menu.
interface InstallStore {
  prompt: InstallPrompt | null;
  installed: boolean;
}

export const useInstall = create<InstallStore>(() => ({ prompt: null, installed: false }));

let listening = false;

export function listenForInstall() {
  if (listening || typeof window === "undefined") return;
  listening = true;
  const standalone = window.matchMedia("(display-mode: standalone)").matches;
  useInstall.setState({ installed: standalone });
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    useInstall.setState({ prompt: e as InstallPrompt });
  });
  window.addEventListener("appinstalled", () => useInstall.setState({ installed: true, prompt: null }));
  // Offline support comes from the service worker, registered in production only.
  if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }
}

export async function installApp() {
  const { prompt } = useInstall.getState();
  if (!prompt) return false;
  await prompt.prompt();
  const choice = await prompt.userChoice;
  useInstall.setState({ prompt: null, installed: choice.outcome === "accepted" });
  return true;
}
