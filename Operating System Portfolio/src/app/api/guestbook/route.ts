import { guardWrite, json, readJson, refuseText } from "@/lib/guard";
import { addPost, listPosts } from "@/lib/posts";
import { cleanText } from "@/lib/sanitize";
import { guestbookEntry, guestbookInput, MAX_NOTE, type GuestbookEntry } from "@/lib/schemas";
import { getStore } from "@/lib/store";

// F27: the guestbook. One note per visitor per hour, 140 characters, links
// stripped, checked for abuse before it is stored.
export async function GET() {
  const store = getStore();
  const entries = await listPosts("guestbook", guestbookEntry, 50);
  return json({ entries, writable: Boolean(store), persistent: store?.persistent ?? false });
}

export async function POST(request: Request) {
  const parsed = guestbookInput.safeParse(await readJson(request));
  if (!parsed.success) return json({ error: "That note could not be read." }, 400);

  const message = cleanText(parsed.data.message);
  const name = parsed.data.name ? cleanText(parsed.data.name) || null : null;
  if (message.length > MAX_NOTE) return json({ error: `Keep it under ${MAX_NOTE} characters.` }, 400);
  const refused = await refuseText(`${name ?? ""} ${message}`, request);
  if (refused) return refused;

  const guard = await guardWrite(request, "guestbook", 1, 3600);
  if (!guard.ok) return guard.response;

  const entry: GuestbookEntry = { id: crypto.randomUUID(), name, message, at: Date.now() };
  await addPost("guestbook", entry);
  return json({ entry }, 201);
}
