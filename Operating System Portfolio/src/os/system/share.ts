"use client";

import { getApp, type AppId } from "@/os/apps/registry";
import { useNotifications } from "@/os/state/notifications";
import { launch } from "./launcher";

// F32: deep links like /?app=experience&item=role-santan-lead open straight to
// an app, and a section inside it, in whatever shell the visitor gets.
export function appLink(id: AppId, item?: string) {
  const url = new URL(window.location.origin);
  url.searchParams.set("app", id);
  if (item) url.searchParams.set("item", item);
  return url.toString();
}

export async function shareApp(id: AppId, item?: string) {
  const url = appLink(id, item);
  const title = `${getApp(id)?.name ?? "folioOS"}: Kurubaran Anandhan`;
  try {
    if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
      await navigator.share({ title, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    useNotifications.getState().push("Link copied", { body: url, toast: true });
  } catch {
    // Cancelled share sheet or blocked clipboard: nothing to report.
  }
}

// Reads a deep link once, opens it, and tidies the address bar.
export function openDeepLink() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("app");
  const app = id ? getApp(id as AppId) : undefined;
  if (!app || app.hidden) return;
  const item = params.get("item")?.slice(0, 80) ?? undefined;
  window.setTimeout(() => launch(app.id, item), 300);
  params.delete("app");
  params.delete("item");
  const rest = params.toString();
  window.history.replaceState(null, "", `${window.location.pathname}${rest ? `?${rest}` : ""}`);
}
