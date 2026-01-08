// hooks/UseNotifications.jsx
import { useState, useEffect, useCallback } from "react";
import { useRealTimeCounts } from "@/context/realtime-counts-context";

/**
 * Safe helper: normalize a raw API URL so it ALWAYS ends with exactly one "/api"
 */

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const {
    markNotificationAsRead: socketMarkAsRead,
    markAllNotificationsAsRead: socketMarkAllAsRead,
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
  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  const url = (path) => {
    const cleanPath = `/${String(path || "").replace(/^\/+/, "")}`;
    return `${API_BASE}${cleanPath}`;
  };

  const getAuthHeaders = () => {
    const token =
      localStorage.getItem("token") || localStorage.getItem("auth_token");
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  };

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(url("notifications"), {
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        const data = await res.json();
        setNotifications(data.data || []);
        setError(null);
      } else {
        const text = await res.text();
        throw new Error(text || "Failed to fetch notifications");
      }
    } catch (err) {
      setError(err.message || "Failed to fetch notifications");
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  const markAsRead = useCallback(
    async (notificationId) => {
      try {
        const res = await fetch(url(`notifications/${notificationId}/read`), {
          method: "PATCH",
          headers: getAuthHeaders(),
        });

        if (res.ok) {
          setNotifications((prev) =>
            prev.map((notif) =>
              notif._id === notificationId ? { ...notif, read: true } : notif
            )
          );

          // Update real-time count via socket
          socketMarkAsRead(notificationId);

          return { success: true };
        }
        throw new Error("Failed to mark as read");
      } catch (err) {
        console.error("Error marking notification as read:", err);
        return { success: false, error: err.message };
      }
    },
    [API_BASE, socketMarkAsRead]
  );

  const markAllAsRead = useCallback(async () => {
    const unreadNotifications = notifications.filter((n) => !n.read);
    const results = await Promise.all(
      unreadNotifications.map((n) => markAsRead(n._id))
    );

    // Update all via socket
    socketMarkAllAsRead();

    return results.every((r) => r.success);
  }, [notifications, markAsRead, socketMarkAllAsRead]);

  const deleteNotification = useCallback(
    async (notificationId) => {
      try {
        const res = await fetch(url(`notifications/${notificationId}`), {
          method: "DELETE",
          headers: getAuthHeaders(),
        });

        if (res.ok) {
          setNotifications((prev) =>
            prev.filter((notif) => notif._id !== notificationId)
          );

          // The socket will automatically update counts when notification is deleted
          // Request count update to sync
          window.dispatchEvent(new CustomEvent("request:count_update"));

          return { success: true };
        }
        throw new Error("Failed to delete notification");
      } catch (err) {
        console.error("Error deleting notification:", err);
        return { success: false, error: err.message };
      }
    },
    [API_BASE]
  );

  const clearAll = useCallback(async () => {
    const results = await Promise.all(
      notifications.map((n) => deleteNotification(n._id))
    );
    return results.every((r) => r.success);
  }, [notifications, deleteNotification]);

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
