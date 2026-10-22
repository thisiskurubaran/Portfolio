import type * as Party from "partykit/server";

// F26: anonymous presence. A visitor is a random alias made here; the only
// thing shared is a pointer position as a fraction of the screen. Nothing is
// stored, and anything unexpected is dropped.
const MIN_INTERVAL_MS = 40;
const MAX_MESSAGE = 120;

type Incoming = { type: "cursor"; x: number; y: number } | { type: "hide" };

function parse(message: string): Incoming | null {
  if (message.length > MAX_MESSAGE) return null;
  let data: unknown;
  try {
    data = JSON.parse(message);
  } catch {
    return null;
  }
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  if (d.type === "hide") return { type: "hide" };
  if (d.type !== "cursor") return null;
  const { x, y } = d;
  if (typeof x !== "number" || typeof y !== "number" || !(x >= 0 && x <= 1 && y >= 0 && y <= 1)) return null;
  return { type: "cursor", x: Math.round(x * 1000) / 1000, y: Math.round(y * 1000) / 1000 };
}

export default class Presence implements Party.Server {
  aliases = new Map<string, string>();
  lastSeen = new Map<string, number>();
  tampered = 0;

  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection) {
    this.aliases.set(conn.id, crypto.randomUUID().slice(0, 8));
    this.broadcastCount();
  }

  onClose(conn: Party.Connection) {
    const alias = this.aliases.get(conn.id);
    this.aliases.delete(conn.id);
    this.lastSeen.delete(conn.id);
    if (alias) this.room.broadcast(JSON.stringify({ type: "leave", id: alias }));
    this.broadcastCount();
  }

  onMessage(message: string | ArrayBuffer | ArrayBufferView, sender: Party.Connection) {
    const msg = typeof message === "string" ? parse(message) : null;
    if (!msg) {
      // Tampered or malformed: dropped, and a client that keeps at it is closed.
      this.tampered++;
      if (this.tampered % 20 === 0) sender.close(1008, "unexpected messages");
      return;
    }
    const now = Date.now();
    if (now - (this.lastSeen.get(sender.id) ?? 0) < MIN_INTERVAL_MS) return;
    this.lastSeen.set(sender.id, now);
    const id = this.aliases.get(sender.id);
    if (!id) return;
    const out = msg.type === "hide" ? { type: "leave", id } : { type: "cursor", id, x: msg.x, y: msg.y };
    this.room.broadcast(JSON.stringify(out), [sender.id]);
  }

  broadcastCount() {
    this.room.broadcast(JSON.stringify({ type: "count", count: this.aliases.size }));
  }
}
