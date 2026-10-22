import { env } from "./env";

// The only form an IP address is ever kept in: a salted SHA-256, cut short.
// Without the salt it cannot be matched back to an address by guessing.
export async function hashIp(ip: string): Promise<string> {
  const salt = env.ipSalt ?? (env.dev ? "folioos-dev-salt" : "");
  const bytes = new TextEncoder().encode(`${salt}:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest).slice(0, 16), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip") || "0.0.0.0";
}

// Equal-time comparison for the admin secret, so timing does not leak it.
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
