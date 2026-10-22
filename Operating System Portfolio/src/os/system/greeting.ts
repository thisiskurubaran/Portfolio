"use client";

import { useEffect } from "react";

const REPO = "https://github.com/thisiskurubaran/Portfolio";
let greeted = false;

// F36: a hello for anyone who opens the console. Logged once on load; there is
// no DevTools detection, tracking or fingerprinting behind it.
export function useConsoleGreeting() {
  useEffect(() => {
    if (greeted) return;
    greeted = true;
    console.log(
      "%ckbOS ground station%c\nHello, fellow developer. kbOS is an open portfolio: Next.js, React, Zustand and a little Three.js.\nSource: %s\nTry the terminal app, or type help in it.",
      "font: 600 14px system-ui; color: #4cc2a8",
      "font: 12px system-ui",
      REPO,
    );
  }, []);
}
