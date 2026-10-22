import { create } from "zustand";

export interface Notification {
  id: number;
  title: string;
  body?: string;
  at: number;
  read: boolean;
}

interface NotificationsStore {
  items: Notification[];
  nextId: number;
  push: (title: string, body?: string) => void;
  markRead: (id: number) => void;
  clear: () => void;
}

export const useNotifications = create<NotificationsStore>((set) => ({
  items: [],
  nextId: 1,
  push: (title, body) =>
    set((s) => ({
      items: [{ id: s.nextId, title, body, at: Date.now(), read: false }, ...s.items],
      nextId: s.nextId + 1,
    })),
  markRead: (id) =>
    set((s) => ({ items: s.items.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
  clear: () => set({ items: [] }),
}));
