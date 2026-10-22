import { NextResponse } from "next/server";
import { clientIp, hashIp } from "@/lib/hash";
import { rateLimit } from "@/lib/ratelimit";
import { deniedPage, STATIC_PAGE_CSP } from "@/lib/securityPages";
import { logThreat, recordOffence } from "@/lib/threats";

// F38: the decoy sign-in posts here. The submitted fields are never read or
// kept; only the fact that someone tried is logged.
export async function POST(request: Request) {
  const visitor = await hashIp(clientIp(request.headers));
  const limit = await rateLimit("honeypot", visitor, 20, 3600);
  if (limit.ok) {
    await logThreat({ type: "honeypot", country: request.headers.get("x-vercel-ip-country"), path: "/admin sign-in", visitor });
    await recordOffence(visitor);
  }
  return new NextResponse(deniedPage(), {
    status: 403,
    headers: { "Content-Type": "text/html; charset=utf-8", "Content-Security-Policy": STATIC_PAGE_CSP, "Cache-Control": "no-store" },
  });
}
