"use client";

import PartySocket from "partysocket";
import { useEffect } from "react";
import { create } from "zustand";

const HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST;
const STALE_MS = 10_000;

export interface Cursor {
  x: number;
  y: number;
  at: number;
}

interface PresenceStore {
  connected: boolean;
  count: number;
  cursors: Record<string, Cursor>;
}

export const usePresence = create<PresenceStore>(() => ({ connected: false, count: 0, cursors: {} }));

let socket: PartySocket | null = null;
let lastSend = 0;

// Messages from the server are checked before use, like every other payload.
function handle(raw: string) {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return;
  }
  if (!data || typeof data !== "object") return;
  const d = data as Record<string, unknown>;
  if (d.type === "count" && typeof d.count === "number") usePresence.setState({ count: Math.max(1, Math.floor(d.count)) });
  else if (d.type === "cursor" && typeof d.id === "string" && typeof d.x === "number" && typeof d.y === "number") {
    const id = d.id.slice(0, 16);
    usePresence.setState((s) => ({ cursors: { ...s.cursors, [id]: { x: d.x as number, y: d.y as number, at: Date.now() } } }));
  } else if (d.type === "leave" && typeof d.id === "string") {
    usePresence.setState((s) => {
      const cursors = { ...s.cursors };
      delete cursors[d.id as string];
      return { cursors };
    });
  }
}

// F26: connects only when a PartyKit host is configured. Without one the
// online indicator simply does not appear.
export function usePresenceConnection(active: boolean) {
  useEffect(() => {
    if (!HOST || !active) return;
    socket = new PartySocket({ host: HOST, room: "folioos" });
    socket.addEventListener("open", () => usePresence.setState({ connected: true }));
    socket.addEventListener("close", () => usePresence.setState({ connected: false }));
    socket.addEventListener("message", (e) => typeof e.data === "string" && handle(e.data));
    const prune = window.setInterval(() => {
      const now = Date.now();
      usePresence.setState((s) => ({ cursors: Object.fromEntries(Object.entries(s.cursors).filter(([, c]) => now - c.at < STALE_MS)) }));
    }, 3000);
    return () => {
      window.clearInterval(prune);
      socket?.close();
      socket = null;
      usePresence.setState({ connected: false, count: 0, cursors: {} });
    };
  }, [active]);
}

export function sendCursor(x: number, y: number) {
  const now = performance.now();
  if (!socket || now - lastSend < 50) return;
  lastSend = now;
  socket.send(JSON.stringify({ type: "cursor", x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) }));
}

export function hideCursor() {
  socket?.send(JSON.stringify({ type: "hide" }));
}

export const presenceHost = HOST;
