import { create } from "zustand";
import type { AppId } from "@/os/apps/registry";

export interface NotificationAction {
  label: string;
  app?: AppId;
  href?: string;
}

export interface Notification {
  id: number;
  title: string;
  body?: string;
  action?: NotificationAction;
  // System alerts (the firewall) get a different look.
  kind?: "info" | "security";
  at: number;
  read: boolean;
}

interface PushOptions {
  body?: string;
  action?: NotificationAction;
  kind?: Notification["kind"];
  // Shown as a toast as well as in the center.
  toast?: boolean;
}

interface NotificationsStore {
  items: Notification[];
  toasts: number[];
  nextId: number;
  push: (title: string, options?: PushOptions | string) => number;
  dismissToast: (id: number) => void;
  markRead: (id: number) => void;
  markAllRead: () => void;
  remove: (id: number) => void;
  clear: () => void;
}

// F10: one notification system for every shell. Other features push here.
export const useNotifications = create<NotificationsStore>((set, get) => ({
  items: [],
  toasts: [],
  nextId: 1,
  push: (title, options) => {
    const opts: PushOptions = typeof options === "string" ? { body: options } : (options ?? {});
    const id = get().nextId;
    set((s) => ({
      items: [{ id, title, body: opts.body, action: opts.action, kind: opts.kind ?? "info", at: Date.now(), read: false }, ...s.items].slice(0, 50),
      toasts: opts.toast === false ? s.toasts : [...s.toasts, id].slice(-3),
      nextId: s.nextId + 1,
    }));
    return id;
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t !== id) })),
  markRead: (id) => set((s) => ({ items: s.items.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
  markAllRead: () => set((s) => (s.items.some((n) => !n.read) ? { items: s.items.map((n) => ({ ...n, read: true })) } : s)),
  remove: (id) => set((s) => ({ items: s.items.filter((n) => n.id !== id), toasts: s.toasts.filter((t) => t !== id) })),
  clear: () => set({ items: [], toasts: [] }),
}));
