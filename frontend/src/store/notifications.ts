import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

interface NotificationState {
  items: NotificationItem[];
  add: (notification: Omit<NotificationItem, "read">) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  unreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (notification) =>
        set((state) => ({
          items: [
            {
              ...notification,
              read: false
            },
            ...state.items
          ].slice(0, 20) // keep the latest 20
        })),
      markRead: (id) =>
        set((state) => ({
          items: state.items.map((item) => (item.id === id ? { ...item, read: true } : item))
        })),
      markAllRead: () =>
        set((state) => ({
          items: state.items.map((item) => ({ ...item, read: true }))
        })),
      unreadCount: () => get().items.filter((item) => !item.read).length
    }),
    {
      name: "notification-store"
    }
  )
);
