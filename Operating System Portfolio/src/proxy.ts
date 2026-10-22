import { NextResponse, type NextRequest } from "next/server";

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

export function proxy(request: NextRequest) {
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
      // Pages only: static files do not need a per request nonce.
      source: "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|resume.pdf|certs/).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
