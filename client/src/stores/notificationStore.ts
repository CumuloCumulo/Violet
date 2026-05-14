import { create } from 'zustand';
import { apiFetch } from '../lib/api';

export interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  content: string | null;
  data: Record<string, unknown> | null;
  read: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  hasMore: boolean;
  loading: boolean;

  fetchNotifications: (reset?: boolean) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  handleIncomingNotification: (notification: NotificationItem) => void;
  setUnreadCount: (count: number) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  hasMore: false,
  loading: false,

  fetchNotifications: async (reset = true) => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const existing = get().notifications;
      const cursor = reset ? undefined : existing[existing.length - 1]?.id;
      const params = new URLSearchParams();
      if (cursor) params.set('cursor', cursor);
      params.set('limit', '20');

      const res = await apiFetch<{ notifications: NotificationItem[]; hasMore: boolean }>(
        `/notifications?${params}`,
      );
      set((state) => ({
        notifications: reset ? res.notifications : [...state.notifications, ...res.notifications],
        hasMore: res.hasMore,
        loading: false,
      }));
    } catch {
      set({ loading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const res = await apiFetch<{ count: number }>('/notifications/unread-count');
      set({ unreadCount: res.count });
    } catch {
      // ignore
    }
  },

  markAsRead: async (id: string) => {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: 'PUT' });
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n,
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch {
      // ignore
    }
  },

  markAllAsRead: async () => {
    try {
      await apiFetch('/notifications/read-all', { method: 'PUT' });
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch {
      // ignore
    }
  },

  handleIncomingNotification: (notification: NotificationItem) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  setUnreadCount: (count: number) => {
    set({ unreadCount: count });
  },
}));
