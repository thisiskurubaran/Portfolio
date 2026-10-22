import { env } from "@/lib/env";
import { guardWrite, json, readJson, refuseText } from "@/lib/guard";
import { cleanText } from "@/lib/sanitize";
import { contactInput } from "@/lib/schemas";

const enabled = () => Boolean(env.resendKey && env.contactTo);

// F30: the Mail app's endpoint. Validated, rate limited and moderated, and it
// only reports success when the email relay accepted the message.
export async function GET() {
  return json({ enabled: enabled() });
}

export async function POST(request: Request) {
  if (!enabled()) return json({ error: "Sending is not connected yet. Use one of the links instead." }, 503);

  const parsed = contactInput.safeParse(await readJson(request));
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    if (field === "email") return json({ error: "That email address does not look right." }, 400);
    if (field === "message") return json({ error: "Write a message of at least 10 characters." }, 400);
    return json({ error: "That message could not be read." }, 400);
  }

  const message = cleanText(parsed.data.message, { stripLinks: false });
  const name = parsed.data.name ? cleanText(parsed.data.name) : "";
  const refused = await refuseText(`${name} ${message}`, request);
  if (refused) return refused;

  const guard = await guardWrite(request, "contact", 3, 3600, { needsStore: false });
  if (!guard.ok) return guard.response;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.contactFrom,
        to: [env.contactTo],
        reply_to: parsed.data.email,
        subject: `folioOS message${name ? ` from ${name}` : ""}`,
        text: `${message}\n\nFrom: ${name || "(no name)"} <${parsed.data.email}>`,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return json({ error: "The message could not be sent right now. Please try again later." }, 502);
    return json({ ok: true });
  } catch {
    return json({ error: "The message could not be sent right now. Please try again later." }, 502);
  }
}
