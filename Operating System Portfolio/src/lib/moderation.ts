// A short list on purpose: it catches the obvious, and the owner can delete
// anything it misses through the admin route.
const PROFANITY = ["fuck", "shit", "cunt", "bitch", "bastard", "asshole", "dickhead", "motherfucker", "nigger", "faggot", "retard", "slut", "whore"];
const PROFANITY_RE = new RegExp(`\\b(${PROFANITY.join("|")})\\w*`, "i");

// Signs that a payload is aimed at the server rather than written for people.
const INJECTION_RE = new RegExp(
  [
    "<\\s*script",
    "javascript\\s*:",
    "on(error|load|click|mouseover)\\s*=",
    "<\\s*iframe",
    "\\bunion\\s+(all\\s+)?select\\b",
    "'\\s*or\\s+'?1'?\\s*=\\s*'?1",
    ";\\s*drop\\s+table",
    "\\.\\./\\.\\./",
    "\\$\\{[^}]*\\}",
    "\\{\\{[^}]*\\}\\}",
    "\\bsleep\\s*\\(\\s*\\d+\\s*\\)",
  ].join("|"),
  "i",
);

export type Verdict = { ok: true } | { ok: false; reason: "profanity" | "injection" | "empty" };

export function moderate(text: string): Verdict {
  if (!text.trim()) return { ok: false, reason: "empty" };
  if (INJECTION_RE.test(text)) return { ok: false, reason: "injection" };
  if (PROFANITY_RE.test(text)) return { ok: false, reason: "profanity" };
  return { ok: true };
}

export const looksLikeInjection = (text: string) => INJECTION_RE.test(text);
