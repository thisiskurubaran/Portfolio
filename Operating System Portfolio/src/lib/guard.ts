import { NextResponse } from "next/server";
import { clientIp, hashIp } from "./hash";
import { moderate } from "./moderation";
import { rateLimit } from "./ratelimit";
import { getStore } from "./store";

export const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function readJson(request: Request): Promise<unknown> {
  // Small bodies only: nothing kbOS accepts is longer than a few KB.
  const text = await request.text();
  if (text.length > 8_000) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

type Guarded = { ok: true; visitor: string } | { ok: false; response: NextResponse };

// Every write route: a store must exist, and the visitor (a salted IP hash)
// must be under the route's rate limit.
export async function guardWrite(request: Request, route: string, max: number, windowSeconds: number, { needsStore = true } = {}): Promise<Guarded> {
  if (needsStore && !getStore()) {
    return { ok: false, response: json({ error: "This feature is not connected yet." }, 503) };
  }
  const visitor = await hashIp(clientIp(request.headers));
  const limit = await rateLimit(route, visitor, max, windowSeconds);
  if (!limit.ok) {
    const minutes = Math.max(1, Math.ceil(limit.retryAfter / 60));
    return {
      ok: false,
      response: NextResponse.json(
        { error: `One at a time, please. Try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`, retryAfter: limit.retryAfter },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter), "Cache-Control": "no-store" } },
      ),
    };
  }
  return { ok: true, visitor };
}

// Shared refusal for text that fails moderation. Injection attempts are
// marked so the client can show the firewall notification.
export function refuseText(text: string): NextResponse | null {
  const verdict = moderate(text);
  if (verdict.ok) return null;
  if (verdict.reason === "injection") return json({ error: "kbOS Firewall blocked this message.", blocked: "injection" }, 400);
  if (verdict.reason === "profanity") return json({ error: "Please keep it friendly." }, 400);
  return json({ error: "Write something first." }, 400);
}
