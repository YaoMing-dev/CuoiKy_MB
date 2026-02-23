import { create } from 'zustand';

const useNotificationStore = create((set) => ({
  notifications: [],
  unreadCount: 0,
  expoPushToken: null,

  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    }),

  setExpoPushToken: (expoPushToken) => set({ expoPushToken }),

  markAsRead: (notificationId) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      ),
      unreadCount: state.unreadCount - 1,
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
}));

export default useNotificationStore;
