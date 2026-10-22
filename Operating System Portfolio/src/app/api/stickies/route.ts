import { guardWrite, json, readJson, refuseText } from "@/lib/guard";
import { addPost, listPosts } from "@/lib/posts";
import { cleanText } from "@/lib/sanitize";
import { MAX_NOTE, stickyInput, stickyNote, type StickyNote } from "@/lib/schemas";
import { getStore } from "@/lib/store";

// F28: sticky notes left on the folioDesk desktop for the next visitor. Same
// limits and moderation as the guestbook.
export async function GET() {
  const store = getStore();
  const notes = await listPosts("stickies", stickyNote, 12);
  return json({ notes, writable: Boolean(store) });
}

export async function POST(request: Request) {
  const parsed = stickyInput.safeParse(await readJson(request));
  if (!parsed.success) return json({ error: "That note could not be read." }, 400);

  const text = cleanText(parsed.data.text);
  if (text.length > MAX_NOTE) return json({ error: `Keep it under ${MAX_NOTE} characters.` }, 400);
  const refused = await refuseText(text, request);
  if (refused) return refused;

  const guard = await guardWrite(request, "stickies", 1, 3600);
  if (!guard.ok) return guard.response;

  const note: StickyNote = { ...parsed.data, text, id: crypto.randomUUID(), at: Date.now() };
  await addPost("stickies", note);
  return json({ note }, 201);
}
