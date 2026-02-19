// hooks/UseNotifications.jsx
import { useState, useEffect, useCallback } from "react";
import { useRealTimeCounts } from "@/context/realtime-counts-context";
import api from "@/services/api";

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const {
    markNotificationAsRead: socketMarkAsRead,
    markAllNotificationsAsRead: socketMarkAllAsRead,
    requestCountUpdate,
  } = useRealTimeCounts();

  // Listen for new notifications from socket
  useEffect(() => {
    const onNew = (e) => {
      const payload = e?.detail;
      if (!payload) return;
      setNotifications((prev) => {
        // Avoid duplicates if already present
        if (prev.some((n) => n._id === payload._id)) return prev;
        return [payload, ...prev];
      });
    };

    window.addEventListener("app:notification", onNew);
    return () => window.removeEventListener("app:notification", onNew);
  }, []);
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.notifications.getAll();
      setNotifications(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to fetch notifications");
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(
    async (notificationId) => {
      try {
        await api.notifications.markAsRead(notificationId);
        setNotifications((prev) =>
          prev.map((notif) =>
            notif._id === notificationId ? { ...notif, read: true } : notif
          )
        );
        socketMarkAsRead(notificationId);
        return { success: true };
      } catch (err) {
        console.error("Error marking notification as read:", err);
        return { success: false, error: err.message };
      }
    },
    [socketMarkAsRead]
  );

  const markAllAsRead = useCallback(async () => {
    const unreadNotifications = notifications.filter((n) => !n.read);
    const results = await Promise.all(
      unreadNotifications.map((n) => markAsRead(n._id))
    );

    const success = results.every((r) => r.success);
    if (success) {
      socketMarkAllAsRead();
    }
    return success;
  }, [notifications, markAsRead, socketMarkAllAsRead]);

  const deleteNotification = useCallback(
    async (notificationId) => {
      try {
        await api.notifications.delete(notificationId);
        setNotifications((prev) =>
          prev.filter((notif) => notif._id !== notificationId)
        );
        requestCountUpdate();
        return { success: true };
      } catch (err) {
        console.error("Error deleting notification:", err);
        return { success: false, error: err.message };
      }
    },
    [requestCountUpdate]
  );

  const clearAll = useCallback(async () => {
    const results = await Promise.all(
      notifications.map((n) => deleteNotification(n._id))
    );
    const success = results.every((r) => r.success);
    if (success) {
      requestCountUpdate();
    }
    return success;
  }, [notifications, deleteNotification, requestCountUpdate]);

  const getUnreadCount = useCallback(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const getNotificationsByType = useCallback(
    (type) => {
      return notifications.filter((n) => n.type === type);
    },
    [notifications]
  );

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    loading,
    error,
    unreadCount: getUnreadCount(),
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    getNotificationsByType,
  };
};
