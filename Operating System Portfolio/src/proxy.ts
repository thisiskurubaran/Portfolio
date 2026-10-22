import { NextResponse, type NextRequest } from "next/server";
import { clientIp, hashIp } from "@/lib/hash";
import { deniedPage, honeypotPage, STATIC_PAGE_CSP, tooManyPage } from "@/lib/securityPages";
import { isBlocked, logThreat, recordOffence } from "@/lib/threats";

// The presence server lives on its own host, so it is the one outside origin
// the page may open a socket to.
const partyHost = process.env.NEXT_PUBLIC_PARTYKIT_HOST;

function contentSecurityPolicy(nonce: string, dev: boolean): string {
  const realtime = partyHost ? ` wss://${partyHost}${dev ? ` ws://${partyHost}` : ""}` : "";
  const directives = [
    "default-src 'self'",
    // Only scripts carrying this request's nonce run, plus whatever they load.
    // React needs eval in development for its error overlays, never in production.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    // Dev mode injects CSS through style tags without a nonce.
    dev ? "style-src 'self' 'unsafe-inline'" : `style-src 'self' 'nonce-${nonce}'`,
    // Window positions and the like are style attributes. They cannot run code.
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    `connect-src 'self'${realtime}${dev ? " ws:" : ""}`,
    "frame-src 'self'",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];
  if (!dev) directives.push("upgrade-insecure-requests");
  return directives.join("; ");
}

// F37 and F38: paths scanners try on every site. The admin-looking ones get
// the decoy; the rest get the access denied screen.
const HONEYPOT = /^\/(wp-admin|wp-login\.php|administrator|phpmyadmin|pma|admin\.php|user\/login|cpanel)(\/|$)/i;
const PROBE = /^\/(\.env|\.git|\.svn|\.aws|\.ssh|\.DS_Store|\.htaccess|xmlrpc\.php|config\.php|wp-config|wp-content|wp-includes|vendor\/phpunit|cgi-bin|server-status|etc\/passwd|boaform|actuator|_profiler|debug\/default|backup|db\.sql|.*\.(php|asp|aspx|jsp|cgi|sql|bak)$)/i;

function staticPage(html: string, status: number, extra: Record<string, string> = {}) {
  return new NextResponse(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", "Content-Security-Policy": STATIC_PAGE_CSP, "Cache-Control": "no-store", ...extra },
  });
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const honeypot = HONEYPOT.test(path);
  const probe = !honeypot && PROBE.test(path);

  // Defend, never reach back: the response is a refusal, and the log keeps a
  // salted hash and the country header only.
  if (honeypot || probe) {
    const visitor = await hashIp(clientIp(request.headers));
    if (await isBlocked(visitor)) return staticPage(tooManyPage(), 429, { "Retry-After": "3600" });
    await logThreat({ type: honeypot ? "honeypot" : "probe", country: request.headers.get("x-vercel-ip-country"), path, visitor });
    await recordOffence(visitor);
    return honeypot ? staticPage(honeypotPage(), 200) : staticPage(deniedPage(), 403);
  }

  const nonce = btoa(crypto.randomUUID());
  const csp = contentSecurityPolicy(nonce, process.env.NODE_ENV === "development");

  // Next.js reads the nonce from the request's CSP header and stamps it on
  // its own scripts during rendering.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      // Pages and probe paths. Static files do not need a per request nonce.
      source: "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|resume.pdf|certs/).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
