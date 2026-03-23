"use client";

import { createContext, useState, useEffect, useContext, useCallback, useRef } from "react";
import { initSocket, getAuthData, isAuthenticated } from "@/lib/socket";
import { useAuth } from "@/context/auth-context";
import api from "@/services/api";

const RealTimeCountsContext = createContext();

const INITIAL_ACTIVITY_COUNTS = {
  "/dashboard/cases": 0,
  "/dashboard/hearings": 0,
  "/dashboard/calendar": 0,
  "/dashboard/documents": 0,
};

export const RealTimeCountsProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const pollingRef = useRef(false);
  const activityPollingRef = useRef(false);
  const lastCaseFingerprintRef = useRef("");

  const [counts, setCounts] = useState({
    messages: 0,
    notifications: 0,
    events: 0,
    total: 0,
  });
  const [activityCounts, setActivityCounts] = useState(INITIAL_ACTIVITY_COUNTS);

  const bumpActivityCount = useCallback((paths) => {
    const normalizedPaths = Array.isArray(paths) ? paths : [paths];

    setActivityCounts((prev) => {
      const next = { ...prev };

      normalizedPaths.forEach((path) => {
        if (!path) return;
        next[path] = (next[path] || 0) + 1;
      });

      return next;
    });
  }, []);

  const resetActivityCount = useCallback((path) => {
    if (!path) return;

    setActivityCounts((prev) => {
      if (!prev[path]) return prev;
      return { ...prev, [path]: 0 };
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    localStorage.setItem("unread_messages_count", String(counts.messages || 0));
    window.dispatchEvent(new Event("unreadCountChanged"));
  }, [counts.messages]);

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
    const handleMessageEvent = (data) => {
      const senderId = data?.senderId || data?.sender?._id || data?.sender;
      const currentUserId = user?.id || user?._id;

      // Own messages should not increase unread counts.
      if (senderId && currentUserId && String(senderId) === String(currentUserId)) {
        return;
      }

      console.log("💬 New message received");
      setCounts((prev) => ({
        ...prev,
        messages: prev.messages + 1,
        total: prev.total + 1,
      }));
    };

    socketInstance.on("message_sent", handleMessageEvent);
    socketInstance.on("message", handleMessageEvent);
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
      bumpActivityCount(["/dashboard/hearings", "/dashboard/calendar"]);
    });

    socketInstance.on("event:updated", () => {
      bumpActivityCount(["/dashboard/hearings", "/dashboard/calendar"]);
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
      bumpActivityCount(["/dashboard/hearings", "/dashboard/calendar"]);
      socketInstance.emit("counts:request_update");
    });

    const handleDocumentActivity = () => {
      bumpActivityCount("/dashboard/documents");
    };

    socketInstance.on("document:uploaded", handleDocumentActivity);
    socketInstance.on("document:updated", handleDocumentActivity);
    socketInstance.on("document:deleted", handleDocumentActivity);
    socketInstance.on("document:shared", handleDocumentActivity);
    socketInstance.on("document:reviewRequested", handleDocumentActivity);
    socketInstance.on("document:reviewed", handleDocumentActivity);
    socketInstance.on("document:statusChanged", handleDocumentActivity);

    // Delivered/seen/delete updates are easier to keep correct with a fresh count sync.
    const requestFreshMessageCounts = () => {
      socketInstance.emit("counts:request_update");
    };

    socketInstance.on("message_seen", requestFreshMessageCounts);
    socketInstance.on("message_deleted", requestFreshMessageCounts);
    socketInstance.on("message:read", requestFreshMessageCounts);

    setSocket(socketInstance);

    return () => {
      socketInstance.off("message_sent", handleMessageEvent);
      socketInstance.off("message", handleMessageEvent);
      socketInstance.off("message_seen", requestFreshMessageCounts);
      socketInstance.off("message_deleted", requestFreshMessageCounts);
      socketInstance.off("message:read", requestFreshMessageCounts);
      socketInstance.off("event:updated");
      socketInstance.off("document:uploaded", handleDocumentActivity);
      socketInstance.off("document:updated", handleDocumentActivity);
      socketInstance.off("document:deleted", handleDocumentActivity);
      socketInstance.off("document:shared", handleDocumentActivity);
      socketInstance.off("document:reviewRequested", handleDocumentActivity);
      socketInstance.off("document:reviewed", handleDocumentActivity);
      socketInstance.off("document:statusChanged", handleDocumentActivity);
      socketInstance.disconnect();
    };
  }, [user, bumpActivityCount]);

  useEffect(() => {
    if (!isAuthenticated() || !user || typeof window === "undefined") {
      return undefined;
    }

    const refreshUnreadMessageCount = async () => {
      if (pollingRef.current) return;

      pollingRef.current = true;

      try {
        const unreadData = await api.chat.getUnreadCounts();
        const nextMessageCount = Number(unreadData?.total || 0);

        setCounts((prev) => {
          const safeMessageCount = Number.isFinite(nextMessageCount)
            ? nextMessageCount
            : 0;
          const diff = safeMessageCount - prev.messages;

          if (diff === 0) {
            return prev;
          }

          return {
            ...prev,
            messages: safeMessageCount,
            total: Math.max(0, prev.total + diff),
          };
        });
      } catch (error) {
        console.error("Error refreshing unread message count:", error);
      } finally {
        pollingRef.current = false;
      }
    };

    refreshUnreadMessageCount();

    const intervalId = window.setInterval(() => {
      if (document.hidden) return;
      refreshUnreadMessageCount();
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated() || !user || typeof window === "undefined") {
      return undefined;
    }

    const refreshSidebarActivity = async () => {
      if (activityPollingRef.current) return;

      activityPollingRef.current = true;

      try {
        const recentCases = await api.dashboard.getRecentCases();
        const normalizedCases = Array.isArray(recentCases)
          ? recentCases
          : recentCases?.data || [];

        const nextCaseFingerprint = normalizedCases
          .map((caseItem) =>
            [
              caseItem?.id || caseItem?._id || "",
              caseItem?.updatedAt || caseItem?.date || "",
              caseItem?.status || "",
            ].join(":")
          )
          .join("|");

        if (!lastCaseFingerprintRef.current) {
          lastCaseFingerprintRef.current = nextCaseFingerprint;
        } else if (
          nextCaseFingerprint &&
          nextCaseFingerprint !== lastCaseFingerprintRef.current
        ) {
          lastCaseFingerprintRef.current = nextCaseFingerprint;
          bumpActivityCount("/dashboard/cases");
        }
      } catch (error) {
        console.error("Error refreshing sidebar activity:", error);
      } finally {
        activityPollingRef.current = false;
      }
    };

    refreshSidebarActivity();

    const intervalId = window.setInterval(() => {
      if (document.hidden) return;
      refreshSidebarActivity();
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [user, bumpActivityCount]);

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
    activityCounts,
    connected,
    socket,
    requestCountUpdate,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    decreaseMessageCount,
    resetActivityCount,
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
