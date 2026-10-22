"use client";

import { useMemo, useRef, useState } from "react";
import { AppIcon } from "@/design/AppIcon";
import { useNotifications } from "@/os/state/notifications";
import { launch } from "@/os/system/launcher";
import { search, type SearchItem } from "@/os/system/search";
import { useFocusTrap } from "./useFocusTrap";

// F06: one search box for every app and every piece of content. Keyboard first:
// type, arrow to a result, Enter to open it.
export function Spotlight({ onClose, fullScreen = false }: { onClose: () => void; fullScreen?: boolean }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const panel = useRef<HTMLDivElement>(null);
  const trap = useFocusTrap(panel);
  const results = useMemo(() => search(query), [query]);
  const current = Math.min(active, Math.max(0, results.length - 1));

  const choose = (item: SearchItem | undefined) => {
    if (!item) return;
    onClose();
    if (item.copy) {
      void navigator.clipboard?.writeText(item.copy).catch(() => undefined);
      useNotifications.getState().push("Copied", { body: item.copy, toast: true });
    } else if (item.href) window.open(item.href, "_blank", "noopener,noreferrer");
    else if (item.appId) launch(item.appId, item.anchor);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") onClose();
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((current + 1) % Math.max(1, results.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((current - 1 + results.length) % Math.max(1, results.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(results[current]);
    } else trap(e);
  };

  return (
    <div className="fixed inset-0 z-[20000]" onKeyDown={onKeyDown}>
      <button aria-label="Close search" tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className={
          fullScreen
            ? "absolute inset-0 flex flex-col bg-ink/95 p-4 pt-12 backdrop-blur-2xl"
            : "absolute left-1/2 top-[18vh] flex max-h-[60vh] w-[min(640px,92vw)] -translate-x-1/2 flex-col overflow-hidden rounded-window border border-line bg-ink/90 shadow-2xl backdrop-blur-2xl"
        }
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="opacity-60">
            <circle cx="11" cy="11" r="6.5" />
            <path d="M16 16l4.5 4.5" strokeLinecap="round" />
          </svg>
          <input
            autoFocus
            role="combobox"
            aria-expanded="true"
            aria-controls="spotlight-results"
            aria-activedescendant={results[current] ? `sr-${results[current].id}` : undefined}
            aria-label="Search apps and content"
            placeholder="Search apps, roles, skills, projects"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            className="h-14 flex-1 bg-transparent text-lg outline-none placeholder:opacity-50"
          />
          {fullScreen && (
            <button onClick={onClose} className="text-sm text-accent-fg">
              Cancel
            </button>
          )}
        </div>
        <ul id="spotlight-results" role="listbox" aria-label="Results" className="min-h-0 flex-1 overflow-auto p-2">
          {results.length === 0 && <li className="p-4 text-sm opacity-60">Nothing matches &quot;{query}&quot;.</li>}
          {results.map((item, i) => (
            <li
              key={item.id}
              id={`sr-${item.id}`}
              role="option"
              aria-selected={i === current}
              onPointerMove={() => setActive(i)}
              onClick={() => choose(item)}
              className={`flex cursor-default items-center gap-3 rounded-control px-3 py-2 ${i === current ? "bg-accent text-on-accent" : ""}`}
            >
              <AppIcon id={item.appId ?? "browser"} icon={item.icon} size={26} />
              <span className="truncate font-medium">{item.label}</span>
              <span className="ml-auto shrink-0 truncate text-xs opacity-70">{item.detail}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
