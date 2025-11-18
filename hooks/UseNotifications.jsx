// UseNotifications.jsx
import { useState, useEffect, useCallback } from 'react';

/**
 * Safe helper: normalize a raw API URL so it ALWAYS ends with exactly one "/api"
 * Examples:
 *  - "http://localhost:5000"         -> "http://localhost:5000/api"
 *  - "http://localhost:5000/"        -> "http://localhost:5000/api"
 *  - "http://localhost:5000/api"     -> "http://localhost:5000/api"
 *  - "http://localhost:5000/api/"    -> "http://localhost:5000/api"
 */
const normalizeApiBase = (raw = 'http://localhost:5000') => {
  // remove trailing slashes
  const noTrailing = String(raw).replace(/\/+$/, '');
  // remove any trailing "/api" (case: env already contains /api)
  const noApi = noTrailing.replace(/\/api$/i, '');
  // append a single "/api"
  return `${noApi}/api`;
};

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // keep this inside useNotifications (after state/hooks are declared)
  useEffect(() => {
    const onNew = (e) => {
      const payload = e?.detail;
      if (!payload) return;
      setNotifications(prev => {
        // avoid duplicates if already present
        if (prev.some(n => n._id === payload._id)) return prev;
        return [payload, ...prev];
      });
    };

    window.addEventListener("app:notification", onNew);
    return () => window.removeEventListener("app:notification", onNew);
  }, []);

  // Normalize the API base so we can't accidentally build /api/api/...
  const RAW = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const API_BASE = normalizeApiBase(RAW); // e.g. "http://localhost:5000/api"

  // helper to build endpoint URLs safely
  const url = (path) => {
    // ensure path starts with a single slash
    const cleanPath = `/${String(path || '').replace(/^\/+/, '')}`;
    return `${API_BASE}${cleanPath}`;
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(url('notifications'), {
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        const data = await res.json();
        setNotifications(data.data || []);
        setError(null);
      } else {
        const text = await res.text();
        throw new Error(text || 'Failed to fetch notifications');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch notifications');
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      const res = await fetch(url(`notifications/${notificationId}/read`), {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        setNotifications(prev =>
          prev.map(notif =>
            notif._id === notificationId ? { ...notif, read: true } : notif
          )
        );
        return { success: true };
      }
      throw new Error('Failed to mark as read');
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return { success: false, error: err.message };
    }
  }, [API_BASE]);

  const markAllAsRead = useCallback(async () => {
    const unreadNotifications = notifications.filter(n => !n.read);
    const results = await Promise.all(
      unreadNotifications.map(n => markAsRead(n._id))
    );
    return results.every(r => r.success);
  }, [notifications, markAsRead]);

  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const res = await fetch(url(`notifications/${notificationId}`), {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
        return { success: true };
      }
      throw new Error('Failed to delete notification');
    } catch (err) {
      console.error('Error deleting notification:', err);
      return { success: false, error: err.message };
    }
  }, [API_BASE]);

  const clearAll = useCallback(async () => {
    const results = await Promise.all(
      notifications.map(n => deleteNotification(n._id))
    );
    return results.every(r => r.success);
  }, [notifications, deleteNotification]);

  const getUnreadCount = useCallback(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const getNotificationsByType = useCallback((type) => {
    return notifications.filter(n => n.type === type);
  }, [notifications]);

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
