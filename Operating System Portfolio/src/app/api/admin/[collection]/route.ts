import type { NextRequest } from "next/server";
import { json } from "@/lib/guard";
import { env } from "@/lib/env";
import { safeEqual } from "@/lib/hash";
import { isCollection, removePost } from "@/lib/posts";

// Owner-only deletion for guestbook entries and sticky notes:
// DELETE /api/admin/guestbook?id=... with the x-admin-secret header.
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ collection: string }> }) {
  const { collection } = await params;
  const secret = request.headers.get("x-admin-secret") ?? "";
  if (!env.adminSecret || !safeEqual(secret, env.adminSecret)) return json({ error: "Not allowed." }, 401);
  if (!isCollection(collection)) return json({ error: "Unknown collection." }, 404);
  const id = request.nextUrl.searchParams.get("id");
  if (!id || id.length > 64) return json({ error: "Missing id." }, 400);
  const removed = await removePost(collection, id);
  return json({ removed }, removed ? 200 : 404);
}
