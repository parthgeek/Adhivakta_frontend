"use client";

import { createContext, useState, useEffect, useContext, useCallback } from "react";
import { initSocket, getAuthData, isAuthenticated } from "@/lib/socket";
import { useAuth } from "@/context/auth-context";

const RealTimeCountsContext = createContext();

export const RealTimeCountsProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  const [counts, setCounts] = useState({
    messages: 0,
    notifications: 0,
    events: 0,
    total: 0,
  });

  // Initialize socket connection
  useEffect(() => {
    if (!isAuthenticated() || !user) {
      return;
    }

    const authData = getAuthData();
    if (!authData) return;

    const socketInstance = initSocket(authData.token);

    socketInstance.on("connect", () => {
      console.log("✅ Real-time counts socket connected");
      setConnected(true);

      // Identify user for personal room
      socketInstance.emit("identify", { userId: user.id || user._id });

      // Join notification room
      socketInstance.emit("notification:join", { userId: user.id || user._id });

      // Join events room
      socketInstance.emit("event:join", { userId: user.id || user._id });

      // Request initial counts
      socketInstance.emit("counts:request_update");
    });

    socketInstance.on("disconnect", () => {
      console.log("❌ Real-time counts socket disconnected");
      setConnected(false);
    });

    // Listen for initial counts
    socketInstance.on("counts:initial", (data) => {
      console.log("📊 Received initial counts:", data);
      setCounts({
        messages: data.messages || 0,
        notifications: data.notifications || 0,
        events: data.events || 0,
        total: data.total || 0,
      });
    });

    // Listen for count updates
    socketInstance.on("counts:update", (data) => {
      console.log("📊 Received count update:", data);
      setCounts({
        messages: data.messages || 0,
        notifications: data.notifications || 0,
        events: data.events || 0,
        total: data.total || 0,
      });
    });

    // Listen for new messages
    socketInstance.on("message", (data) => {
      console.log("💬 New message received");
      setCounts((prev) => ({
        ...prev,
        messages: prev.messages + 1,
        total: prev.total + 1,
      }));
    });
    // Track processed notification IDs to prevent double-counting
    const processedNotificationIds = new Set();

    // Common handler for processing notifications
    const handleNewNotification = (data, eventName) => {
      const notification = data?.notification || data;
      const notificationId = notification?._id;

      // Prevent double-counting if we already processed this notification
      if (notificationId && processedNotificationIds.has(notificationId)) {
        console.log(`🔔 Skipping duplicate notification (${eventName}):`, notificationId);
        return;
      }

      if (notificationId) {
        processedNotificationIds.add(notificationId);
        // Clean up after 10 seconds to prevent memory leak
        setTimeout(() => processedNotificationIds.delete(notificationId), 10000);
      }

      console.log(`🔔 New notification received (${eventName}):`, data);
      setCounts((prev) => ({
        ...prev,
        notifications: prev.notifications + 1,
        total: prev.total + 1,
      }));

      // Dispatch custom event for notification page
      window.dispatchEvent(
        new CustomEvent("app:notification", { detail: notification })
      );
    };

    // Listen for new notifications (notification:new event from socket helper)
    socketInstance.on("notification:new", (data) => {
      handleNewNotification(data, "notification:new");
    });

    // Also listen for "notification" event (from controllers)
    socketInstance.on("notification", (data) => {
      handleNewNotification(data, "notification");
    });

    // Listen for notification count updates
    socketInstance.on("notification:count_update", (data) => {
      console.log("🔔 Notification count update:", data);
      setCounts((prev) => {
        const diff = data.count - prev.notifications;
        return {
          ...prev,
          notifications: data.count,
          total: prev.total + diff,
        };
      });
    });

    // Listen for new events
    socketInstance.on("event:new", (data) => {
      console.log("📅 New event received:", data);
      setCounts((prev) => ({
        ...prev,
        events: prev.events + 1,
        total: prev.total + 1,
      }));
    });

    // Listen for upcoming event count updates
    socketInstance.on("event:upcoming_count_update", (data) => {
      console.log("📅 Event count update:", data);
      setCounts((prev) => {
        const diff = data.count - prev.events;
        return {
          ...prev,
          events: data.count,
          total: prev.total + diff,
        };
      });
    });

    // Listen for event deletion
    socketInstance.on("event:deleted", () => {
      console.log("📅 Event deleted");
      socketInstance.emit("counts:request_update");
    });

    // Listen for message read events to decrease count
    socketInstance.on("message:read", () => {
      setCounts((prev) => ({
        ...prev,
        messages: Math.max(0, prev.messages - 1),
        total: Math.max(0, prev.total - 1),
      }));
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user]);

  // Request count update
  const requestCountUpdate = useCallback(() => {
    if (socket && connected) {
      socket.emit("counts:request_update");
    }
  }, [socket, connected]);

  // Mark notification as read
  const markNotificationAsRead = useCallback(
    (notificationId) => {
      if (socket && connected && user) {
        socket.emit("notification:mark_read", {
          notificationId,
          userId: user.id || user._id,
        });
      }
    },
    [socket, connected, user]
  );

  // Mark all notifications as read
  const markAllNotificationsAsRead = useCallback(() => {
    if (socket && connected && user) {
      socket.emit("notification:mark_all_read", {
        userId: user.id || user._id,
      });
    }
  }, [socket, connected, user]);

  // Decrease message count (call when user reads a message)
  const decreaseMessageCount = useCallback((amount = 1) => {
    setCounts((prev) => ({
      ...prev,
      messages: Math.max(0, prev.messages - amount),
      total: Math.max(0, prev.total - amount),
    }));
  }, []);

  const value = {
    counts,
    connected,
    socket,
    requestCountUpdate,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    decreaseMessageCount,
  };

  return (
    <RealTimeCountsContext.Provider value={value}>
      {children}
    </RealTimeCountsContext.Provider>
  );
};

export const useRealTimeCounts = () => {
  const context = useContext(RealTimeCountsContext);
  if (context === undefined) {
    throw new Error("useRealTimeCounts must be used within a RealTimeCountsProvider");
  }
  return context;
};