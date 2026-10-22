"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Icon, type IconName } from "@/design/icons";

export type MenuItem =
  | { separator: true }
  | {
      separator?: false;
      label: string;
      icon?: IconName;
      shortcut?: string;
      danger?: boolean;
      disabled?: boolean;
      onSelect: () => void;
    };

// One menu for context menus and the menu bar: arrow keys move, Enter picks,
// Escape or a click outside closes. It flips to stay on screen.
// With "above", y is the bottom edge: used for the dock, where menus open upward.
export function Menu({ items, x, y, onClose, label, above = false }: { items: MenuItem[]; x: number; y: number; onClose: () => void; label: string; above?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x, y });
  const actionable = items.flatMap((item, i) => (!item.separator && !item.disabled ? [i] : []));
  const [active, setActive] = useState(actionable[0] ?? -1);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    // Measuring the rendered size is the only way to keep it on screen.
    const top = above ? y - r.height : y;
    setPos({ x: Math.max(6, Math.min(x, window.innerWidth - r.width - 6)), y: top + r.height > window.innerHeight - 6 ? Math.max(6, y - r.height) : Math.max(6, top) });
  }, [x, y, above]);

  useEffect(() => {
    ref.current?.focus();
    const away = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && onClose();
    window.addEventListener("pointerdown", away, true);
    return () => window.removeEventListener("pointerdown", away, true);
  }, [onClose]);

  const pick = (i: number) => {
    const item = items[i];
    if (!item || item.separator || item.disabled) return;
    onClose();
    item.onSelect();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const at = actionable.indexOf(active);
    if (e.key === "ArrowDown") setActive(actionable[(at + 1) % actionable.length]!);
    else if (e.key === "ArrowUp") setActive(actionable[(at - 1 + actionable.length) % actionable.length]!);
    else if (e.key === "Enter" || e.key === " ") pick(active);
    else if (e.key === "Escape" || e.key === "Tab") onClose();
    else return;
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      ref={ref}
      role="menu"
      aria-label={label}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      onContextMenu={(e) => e.preventDefault()}
      className="fixed z-[60000] min-w-52 rounded-xl border border-line bg-surface/95 p-1 text-[13px] shadow-3 outline-none backdrop-blur-2xl"
      style={{ left: pos.x, top: pos.y }}
    >
      {items.map((item, i) =>
        item.separator ? (
          <div key={`sep-${i}`} role="separator" className="mx-2 my-1 h-px bg-line" />
        ) : (
          <button
            key={item.label}
            role="menuitem"
            disabled={item.disabled}
            onPointerEnter={() => setActive(i)}
            onClick={() => pick(i)}
            className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left disabled:opacity-40 ${
              i === active ? (item.danger ? "bg-danger text-white" : "bg-accent text-on-accent") : item.danger ? "text-danger" : ""
            }`}
          >
            <span className="w-4 shrink-0">{item.icon && <Icon name={item.icon} size={15} />}</span>
            <span className="flex-1">{item.label}</span>
            {item.shortcut && <span className={`text-xs ${i === active ? "" : "text-muted"}`}>{item.shortcut}</span>}
          </button>
        ),
      )}
    </div>
  );
}
