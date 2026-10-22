import type { NextConfig } from "next";
import pkg from "./package.json" with { type: "json" };

// Headers that do not change per request. The CSP needs a fresh nonce each
// time, so it is set in src/proxy.ts instead.
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The resume viewer frames our own PDF, so same-origin framing stays allowed.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  {
    key: "Permissions-Policy",
    value: ["camera=()", "microphone=()", "geolocation=()", "payment=()", "usb=()", "browsing-topics=()"].join(", "),
  },
];

const config: NextConfig = {
  reactStrictMode: true,
  // Shown in About folioOS; only the version number reaches the client.
  env: { NEXT_PUBLIC_FOLIOOS_VERSION: pkg.version },
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default config;
