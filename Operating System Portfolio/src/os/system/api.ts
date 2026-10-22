"use client";

import { useNotifications } from "@/os/state/notifications";

export type PostResult<T> = { ok: true; data: T } | { ok: false; error: string; status: number };

// Posts JSON to a folioOS route and turns every failure into a message a person
// can read. A blocked payload also raises the firewall alert (F37).
export async function postJson<T>(url: string, body: unknown): Promise<PostResult<T>> {
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (res.ok) return { ok: true, data: data as T };
    if (data.blocked) {
      useNotifications.getState().push("folioOS Firewall blocked a connection", {
        body: "That input looked like an attack on the server, so it was refused. If this was a mistake, rephrase and try again.",
        kind: "security",
      });
    }
    return { ok: false, status: res.status, error: typeof data.error === "string" ? data.error : "Something went wrong. Please try again." };
  } catch {
    return { ok: false, status: 0, error: "No connection. Check your network and try again." };
  }
}
