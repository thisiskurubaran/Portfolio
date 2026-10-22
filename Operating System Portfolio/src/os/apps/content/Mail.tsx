"use client";

import { useEffect, useState } from "react";
import { contact } from "@/content";
import { postJson } from "@/os/system/api";

type State = "checking" | "off" | "idle" | "sending" | "sent";

// F16 and F30: a compose window wired to the real contact endpoint. It only
// says "sent" when the server confirms it; otherwise it says what went wrong.
export default function Mail() {
  const [state, setState] = useState<State>("checking");
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", message: "", website: "" });

  useEffect(() => {
    fetch("/api/contact")
      .then((r) => r.json())
      .then((d) => setState(d.enabled ? "idle" : "off"))
      .catch(() => setState("off"));
  }, []);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    setError(null);
    const res = await postJson("/api/contact", { ...form, name: form.name || undefined, website: form.website || undefined });
    if (res.ok) {
      setState("sent");
      setForm({ name: "", email: "", message: "", website: "" });
    } else {
      setState("idle");
      setError(res.error);
    }
  };

  const disabled = state !== "idle";
  return (
    <div className="space-y-5 p-6">
      {state === "sent" ? (
        <div role="status" className="rounded-control bg-accent/15 p-4">
          <p className="font-medium">Message sent.</p>
          <p className="mt-1 text-sm opacity-80">Thanks for writing. The reply will come to the address you gave.</p>
          <button onClick={() => setState("idle")} className="mt-3 text-sm text-accent-fg underline">
            Write another
          </button>
        </div>
      ) : (
        <form onSubmit={submit} aria-describedby="mail-note" className="space-y-3">
          <label className="block text-sm">
            Your name <span className="opacity-60">(optional)</span>
            <input disabled={disabled} value={form.name} onChange={set("name")} maxLength={80} className="mt-1 w-full rounded-control bg-glass p-2 disabled:opacity-50" />
          </label>
          <label className="block text-sm">
            Your email
            <input disabled={disabled} required type="email" value={form.email} onChange={set("email")} maxLength={200} className="mt-1 w-full rounded-control bg-glass p-2 disabled:opacity-50" />
          </label>
          <label className="block text-sm">
            Message
            <textarea disabled={disabled} required minLength={10} maxLength={4000} rows={6} value={form.message} onChange={set("message")} className="mt-1 w-full rounded-control bg-glass p-2 disabled:opacity-50" />
          </label>
          {/* Hidden from people and screen readers; bots tend to fill it. */}
          <input tabIndex={-1} aria-hidden autoComplete="off" value={form.website} onChange={set("website")} className="hidden" name="website" />
          <button disabled={disabled} className="rounded-control bg-accent px-4 py-2 text-sm font-medium text-on-accent disabled:opacity-40">
            {state === "sending" ? "Sending" : "Send"}
          </button>
          {error && (
            <p role="alert" className="text-sm text-red-400">
              {error}
            </p>
          )}
          <p id="mail-note" className="text-sm opacity-70">
            {state === "off"
              ? "Sending is not connected yet, so nothing leaves this form. Reach me through one of these:"
              : state === "checking"
                ? "Checking the mail server."
                : "Up to three messages an hour. Or reach me through one of these:"}
          </p>
        </form>
      )}
      <ul className="flex flex-wrap gap-3">
        {contact.links.map((link) => (
          <li key={link.id}>
            <a href={link.url} target="_blank" rel="noopener noreferrer" className="rounded-full border border-line px-3 py-1 text-sm hover:bg-glass-strong">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
