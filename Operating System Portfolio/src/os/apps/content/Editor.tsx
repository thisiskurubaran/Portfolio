"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/design/icons";

const KEY = "folioos.scratchpad";

function load() {
  try {
    return window.localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

// F25: a scratchpad. Text stays in this browser only and can be downloaded.
export default function Editor() {
  const [text, setText] = useState(load);
  const [mono, setMono] = useState(false);
  const [saved, setSaved] = useState(true);

  useEffect(() => {
    // Typing marks the text unsaved until the debounced write below lands.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaved(false);
    const t = window.setTimeout(() => {
      try {
        window.localStorage.setItem(KEY, text);
      } catch {
        // Storage blocked: the text still works for this visit.
      }
      setSaved(true);
    }, 400);
    return () => window.clearTimeout(t);
  }, [text]);

  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "scratchpad.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const tool = "flex items-center gap-1.5 rounded-control px-2.5 py-1 text-xs font-medium hover:bg-glass-strong";
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1 border-b border-line bg-raised px-2 py-1.5">
        <button onClick={() => setText("")} className={tool}>
          <Icon name="plus" size={14} /> New
        </button>
        <button onClick={download} disabled={!text} className={`${tool} disabled:opacity-40`}>
          <Icon name="download" size={14} /> Download .txt
        </button>
        <button onClick={() => setMono((m) => !m)} aria-pressed={mono} className={`${tool} ${mono ? "bg-glass-strong" : ""}`}>
          Monospace
        </button>
        <span className="ml-auto pr-2 text-xs text-muted">
          {words} words · {saved ? "Saved in this browser" : "Saving"}
        </span>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Start typing. Nothing leaves this browser."
        aria-label="Scratchpad"
        spellCheck
        className={`min-h-0 flex-1 resize-none bg-surface p-5 text-[15px] leading-relaxed outline-none placeholder:text-subtle ${mono ? "font-mono text-sm" : ""}`}
      />
    </div>
  );
}
