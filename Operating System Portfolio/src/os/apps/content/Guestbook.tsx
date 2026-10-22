"use client";

import { useEffect, useState } from "react";
import { MAX_NOTE } from "@/lib/limits";
import type { GuestbookEntry } from "@/lib/schemas";
import { postJson } from "@/os/system/api";

type Load = { status: "loading" } | { status: "ready"; entries: GuestbookEntry[]; writable: boolean; persistent: boolean } | { status: "error" };

const when = (at: number) => new Date(at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });

// F27: visitors sign the guestbook. Text is rendered as text, never as HTML.
export default function Guestbook() {
  const [load, setLoad] = useState<Load>({ status: "loading" });
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/guestbook")
      .then((r) => r.json())
      .then((d) => setLoad({ status: "ready", entries: d.entries ?? [], writable: !!d.writable, persistent: !!d.persistent }))
      .catch(() => setLoad({ status: "error" }));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setFeedback(null);
    const res = await postJson<{ entry: GuestbookEntry }>("/api/guestbook", { name: name || undefined, message });
    setSending(false);
    if (!res.ok) return setFeedback({ ok: false, text: res.error });
    setMessage("");
    setFeedback({ ok: true, text: "Thanks for signing." });
    setLoad((l) => (l.status === "ready" ? { ...l, entries: [res.data.entry, ...l.entries] } : l));
  };

  return (
    <div className="space-y-5 p-6">
      {load.status === "ready" && load.writable ? (
        <form onSubmit={submit} className="space-y-2 rounded-control bg-glass p-4">
          <label className="block text-sm">
            Name <span className="text-muted">(optional)</span>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} className="mt-1 w-full rounded-control bg-glass p-2" />
          </label>
          <label className="block text-sm">
            Note
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={MAX_NOTE} rows={3} required className="mt-1 w-full rounded-control bg-glass p-2" />
          </label>
          <div className="flex items-center gap-3 text-sm">
            <button disabled={sending || !message.trim()} className="rounded-control bg-accent px-4 py-1.5 font-medium text-on-accent disabled:opacity-40">
              {sending ? "Signing" : "Sign"}
            </button>
            <span className="tabular-nums text-muted">{MAX_NOTE - message.length} left</span>
            <span className="ml-auto text-xs text-muted">One note per hour. Links are removed.</span>
          </div>
          {feedback && (
            <p role="status" className={`text-sm ${feedback.ok ? "text-accent-fg" : "text-red-400"}`}>
              {feedback.text}
            </p>
          )}
          {!load.persistent && <p className="text-xs text-muted">Development mode: notes are kept in memory and vanish on restart.</p>}
        </form>
      ) : load.status === "ready" ? (
        <p className="rounded-control bg-glass p-4 text-sm text-muted">The guestbook is not connected yet, so it cannot take new notes.</p>
      ) : null}

      {load.status === "loading" && <p className="text-sm text-muted">Loading notes</p>}
      {load.status === "error" && <p className="text-sm text-muted">The guestbook could not be loaded.</p>}
      {load.status === "ready" && (
        <ul className="space-y-3">
          {load.entries.length === 0 && <li className="text-sm text-muted">No notes yet. Be the first.</li>}
          {load.entries.map((entry) => (
            <li key={entry.id} className="rounded-control bg-glass p-4">
              <p className="whitespace-pre-wrap break-words text-sm">{entry.message}</p>
              <p className="mt-2 text-xs text-muted">
                {entry.name ?? "Anonymous"} · {when(entry.at)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
