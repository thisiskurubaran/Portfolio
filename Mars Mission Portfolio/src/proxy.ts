import { NextResponse, type NextRequest } from "next/server";

// Geo headers, probe detection and honeypot routing (F19, F36) land here later.

function contentSecurityPolicy(nonce: string, dev: boolean): string {
  const directives = [
    "default-src 'self'",
    // Only scripts carrying this request's nonce run, plus whatever they load.
    // React needs eval in development for its error overlays, never in production.
    // wasm-unsafe-eval lets the rover physics (Rapier) compile its WebAssembly;
    // it allows no JavaScript eval.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'wasm-unsafe-eval'${dev ? " 'unsafe-eval'" : ""}`,
    // Dev mode injects CSS through style tags without a nonce.
    dev ? "style-src 'self' 'unsafe-inline'" : `style-src 'self' 'nonce-${nonce}'`,
    // Server rendered markup (next/image among others) uses style attributes.
    // They cannot run code, so allowing them keeps the policy strict where it counts.
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "media-src 'self'",
    "font-src 'self'",
    `connect-src 'self'${dev ? " ws:" : ""}`,
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
      // Pages only: static files and images do not need a per request nonce.
      source: "/((?!api|_next/static|_next/image|favicon.ico|models/|textures/|data/|audio/).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
