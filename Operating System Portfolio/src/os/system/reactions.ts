"use client";

import { useEffect } from "react";
import { useNotifications } from "@/os/state/notifications";
import { launch } from "./launcher";
import { usePower } from "./power";

const once = (key: string) => {
  try {
    if (window.sessionStorage.getItem(key)) return false;
    window.sessionStorage.setItem(key, "1");
  } catch {
    // Blocked storage: at worst the greeting shows again next load.
  }
  return true;
};

const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];

// F29: the Konami code opens the secret app.
export function useKonami(active: boolean) {
  useEffect(() => {
    if (!active) return;
    let i = 0;
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      i = key === KONAMI[i] ? i + 1 : key === KONAMI[0] ? 1 : 0;
      if (i === KONAMI.length) {
        i = 0;
        launch("nets");
        useNotifications.getState().push("Secret unlocked", { body: "You found the nets. Mind the bouncers.", toast: true });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);
}

const RECRUITER_SITES: [RegExp, string][] = [
  [/(^|\.)linkedin\.com$/, "LinkedIn"],
  [/(^|\.)naukri\.com$/, "Naukri"],
  [/(^|\.)indeed\.[a-z.]+$/, "Indeed"],
  [/(^|\.)glassdoor\.[a-z.]+$/, "Glassdoor"],
  [/(^|\.)wellfound\.com$|(^|\.)angel\.co$/, "Wellfound"],
  [/(^|\.)instahyre\.com$/, "Instahyre"],
  [/(^|\.)hired\.com$/, "Hired"],
  [/(^|\.)otta\.com$|(^|\.)welcometothejungle\.com$/, "Welcome to the Jungle"],
];

// F32: someone arriving from a job board probably wants the resume first.
export function useRecruiterShortcut(active: boolean) {
  useEffect(() => {
    if (!active || !document.referrer) return;
    let host = "";
    try {
      host = new URL(document.referrer).hostname.toLowerCase();
    } catch {
      return;
    }
    const site = RECRUITER_SITES.find(([re]) => re.test(host))?.[1];
    if (!site || !once("kbos.recruiter")) return;
    const t = window.setTimeout(() => {
      useNotifications.getState().push(`Hello, visitor from ${site}`, {
        body: "Looking for the resume? It is one click away, and so is every role in detail.",
        action: { label: "Open Resume", app: "resume" },
      });
    }, 800);
    return () => window.clearTimeout(t);
  }, [active]);
}

const HELLO: Record<string, string> = {
  ta: "Vanakkam",
  hi: "Namaste",
  te: "Namaskaram",
  kn: "Namaskara",
  ml: "Namaskaram",
  bn: "Nomoshkar",
  mr: "Namaskar",
  es: "Hola",
  fr: "Bonjour",
  de: "Hallo",
  it: "Ciao",
  pt: "Olá",
  nl: "Hallo",
  ja: "こんにちは",
  ko: "안녕하세요",
  zh: "你好",
  ar: "مرحبا",
  ru: "Привет",
};

// Only English exists for now. When a translation is added, list it here and
// the greeting offers to switch.
const TRANSLATIONS: string[] = [];

// F33: a hello in the visitor's own language when it is not English.
export function useLanguageHello(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const lang = (navigator.languages?.[0] ?? navigator.language ?? "en").toLowerCase().split("-")[0]!;
    if (lang === "en" || !once("kbos.hello")) return;
    let name = lang;
    try {
      name = new Intl.DisplayNames(["en"], { type: "language" }).of(lang) ?? lang;
    } catch {
      // keep the code
    }
    const greeting = HELLO[lang] ?? "Hello";
    const t = window.setTimeout(() => {
      useNotifications.getState().push(`${greeting}!`, {
        body: TRANSLATIONS.includes(lang)
          ? `This site is also available in ${name}.`
          : `Your browser prefers ${name}. kbOS is only in English for now, but you are very welcome here.`,
      });
    }, 2500);
    return () => window.clearTimeout(t);
  }, [active]);
}

type Connection = { saveData?: boolean; effectiveType?: string };

// F35: a short frame rate sample after boot, plus the connection's own hints.
// Below 30 fps, or on a save-data or 2G connection, low-power mode turns on.
export function useLowPowerProbe(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const conn = (navigator as Navigator & { connection?: Connection }).connection;
    const announce = (reason: string) => {
      usePower.getState().setLowPower(true, reason);
      useNotifications.getState().push("Low-power mode is on", { body: `${reason} Blur and heavy animation are off, and kbVision is skipped.`, toast: false });
    };
    if (conn?.saveData || conn?.effectiveType === "2g" || conn?.effectiveType === "slow-2g") {
      announce("Your connection asked to save data.");
      return;
    }
    let frames = 0;
    let raf = 0;
    let started = 0;
    const SAMPLE_MS = 2000;
    const tick = (t: number) => {
      if (!started) started = t;
      frames++;
      if (t - started < SAMPLE_MS) raf = requestAnimationFrame(tick);
      else if (document.visibilityState === "visible" && (frames * 1000) / (t - started) < 30) announce("This device is drawing under 30 frames a second.");
    };
    // Wait for the shell's own start-up work to settle before measuring.
    const delay = window.setTimeout(() => (raf = requestAnimationFrame(tick)), 1500);
    return () => {
      window.clearTimeout(delay);
      cancelAnimationFrame(raf);
    };
  }, [active]);
}
