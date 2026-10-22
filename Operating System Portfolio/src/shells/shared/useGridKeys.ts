"use client";

import type { KeyboardEvent } from "react";

// Arrow keys move focus between the buttons of a grid laid out in rows of
// `columns`. Tab still leaves the grid as usual.
export function useGridKeys(columns: number) {
  return (e: KeyboardEvent<HTMLElement>) => {
    const step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: columns, ArrowUp: -columns }[e.key];
    if (!step) return;
    const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>("button, a[href]"));
    const index = items.indexOf(document.activeElement as HTMLElement);
    if (index === -1) return;
    const next = items[index + step];
    if (next) {
      e.preventDefault();
      next.focus();
    }
  };
}
