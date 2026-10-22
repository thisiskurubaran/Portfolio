"use client";

import { useEffect, useRef } from "react";
import { shortcutGroups, useShortcutsSheet } from "@/os/system/shortcuts";
import { useFocusTrap } from "./useFocusTrap";

function Keys({ combo }: { combo: string }) {
  return (
    <span className="flex flex-wrap justify-end gap-1">
      {combo.split(" ").map((k, i) =>
        k === "or" || k === "and" ? (
          <span key={i} className="px-0.5 text-xs text-muted">
            {k}
          </span>
        ) : (
          <kbd key={i} className="min-w-6 rounded-md border border-line-strong bg-raised px-1.5 py-0.5 text-center font-sans text-[11px] font-semibold shadow-1">
            {k.replace(/,$/, "")}
          </kbd>
        ),
      )}
    </span>
  );
}

// F21: the keyboard shortcuts sheet, opened with Ctrl / from any shell.
export function ShortcutsSheet() {
  const setOpen = useShortcutsSheet((s) => s.setOpen);
  const ref = useRef<HTMLDivElement>(null);
  const trap = useFocusTrap(ref);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <div className="fixed inset-0 z-[52000] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        onKeyDown={(e) => (e.key === "Escape" ? setOpen(false) : trap(e))}
        className="folio-fade-in max-h-[85vh] w-full max-w-xl overflow-auto rounded-sheet border border-line bg-surface p-6 shadow-3 outline-none"
      >
        <div className="mb-4 flex items-center">
          <h2 className="flex-1 font-display text-lg font-semibold">Keyboard shortcuts</h2>
          <button onClick={() => setOpen(false)} className="rounded-control px-3 py-1 text-sm hover:bg-glass-strong">
            Done
          </button>
        </div>
        {shortcutGroups.map((g) => (
          <section key={g.title} className="mb-5" aria-label={g.title}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{g.title}</h3>
            <dl className="divide-y divide-line rounded-card border border-line">
              {g.items.map(([combo, what]) => (
                <div key={combo} className="flex items-center justify-between gap-4 px-3 py-2 text-sm">
                  <dt>{what}</dt>
                  <dd>
                    <Keys combo={combo} />
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </div>
  );
}
