"use client";

import { useEffect, useState } from "react";
import { MAX_NOTE, stickyColors, type StickyColor } from "@/lib/limits";
import type { StickyNote } from "@/lib/schemas";
import { postJson } from "@/os/system/api";
import { useDesk } from "./state";

const paper: Record<StickyColor, string> = {
  yellow: "#f6e27a",
  mint: "#a8e6cf",
  rose: "#f7b6c2",
  sky: "#a9d4f5",
};

function Note({ note }: { note: Pick<StickyNote, "text" | "color" | "x" | "y" | "at"> }) {
  return (
    <figure
      className="absolute w-44 -rotate-2 p-3 text-sm text-[#1d1d1d] shadow-lg"
      style={{ left: `${note.x * 100}%`, top: `${note.y * 100}%`, background: paper[note.color] }}
    >
      <blockquote className="whitespace-pre-wrap break-words leading-snug">{note.text}</blockquote>
      <figcaption className="mt-2 text-[10px] opacity-60">Left by a visitor, {new Date(note.at).toLocaleDateString([], { month: "short", day: "numeric" })}</figcaption>
    </figure>
  );
}

// F28: notes earlier visitors left on the desktop, under the windows.
export function StickyLayer() {
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const added = useDesk((s) => s.addedSticky);
  useEffect(() => {
    fetch("/api/stickies")
      .then((r) => r.json())
      .then((d) => setNotes(Array.isArray(d.notes) ? d.notes : []))
      .catch(() => setNotes([]));
  }, [added]);
  return (
    <div aria-label="Sticky notes from visitors" role="region" className="pointer-events-none absolute inset-x-0 bottom-24 top-8">
      {notes.map((n) => (
        <Note key={n.id} note={n} />
      ))}
    </div>
  );
}

// Places the new note somewhere in the middle band of the desktop.
const randomSpot = () => ({ x: 0.05 + Math.random() * 0.75, y: 0.1 + Math.random() * 0.6 });

export function StickyComposer() {
  const setOverlay = useDesk((s) => s.setOverlay);
  const bumpSticky = useDesk((s) => s.bumpSticky);
  const [text, setText] = useState("");
  const [color, setColor] = useState<StickyColor>("yellow");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    const res = await postJson("/api/stickies", { text, color, ...randomSpot() });
    setSending(false);
    if (!res.ok) return setError(res.error);
    bumpSticky();
    setOverlay(null);
  };

  return (
    <div role="dialog" aria-label="Leave a sticky note" onKeyDown={(e) => e.key === "Escape" && setOverlay(null)} className="fixed inset-0 z-[14000] flex items-center justify-center bg-black/30">
      <form onSubmit={submit} className="w-72 -rotate-1 p-4 text-[#1d1d1d] shadow-2xl" style={{ background: paper[color] }}>
        <label className="block text-xs font-medium">
          Leave a note for the next visitor
          <textarea autoFocus value={text} onChange={(e) => setText(e.target.value)} maxLength={MAX_NOTE} rows={4} required className="mt-2 w-full resize-none bg-transparent text-sm outline-none" />
        </label>
        <div role="radiogroup" aria-label="Colour" className="mt-2 flex gap-2">
          {stickyColors.map((c) => (
            <button key={c} type="button" role="radio" aria-checked={color === c} aria-label={c} onClick={() => setColor(c)} className={`h-5 w-5 rounded-full border border-black/30 ${color === c ? "ring-2 ring-black/60" : ""}`} style={{ background: paper[c] }} />
          ))}
          <span className="ml-auto text-xs tabular-nums opacity-60">{MAX_NOTE - text.length}</span>
        </div>
        {error && (
          <p role="alert" className="mt-2 text-xs text-red-800">
            {error}
          </p>
        )}
        <div className="mt-3 flex justify-end gap-2 text-sm">
          <button type="button" onClick={() => setOverlay(null)} className="px-2 py-1">
            Cancel
          </button>
          <button disabled={sending || !text.trim()} className="rounded bg-black/80 px-3 py-1 text-white disabled:opacity-40">
            {sending ? "Sticking" : "Stick it"}
          </button>
        </div>
        <p className="mt-2 text-[10px] opacity-60">One note an hour. Links are removed. The owner can take notes down.</p>
      </form>
    </div>
  );
}
