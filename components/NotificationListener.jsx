"use client";

import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { AlertCircle, Bell, CheckCircle } from "lucide-react";

export default function NotificationListener({ user }) {
  const socketRef = useRef(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const userId = user?._id || user?.id;
    if (!userId) {
      console.log("No user ID available for socket connection");
      return;
    }

    // Build SOCKET_URL
    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ||
      (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/api\/?$/, "");

    console.log("🔌 Connecting to socket:", SOCKET_URL);
    console.log("👤 User ID:", userId);

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      auth: {
        token: typeof window !== "undefined" ?
          localStorage.getItem("token") || localStorage.getItem("auth_token") : null,
      },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
      socket.emit("identify", { userId: String(userId) });
    });

    // Track processed notification IDs to prevent duplicate toasts
    const processedNotificationIds = new Set();

    // Common handler for showing notification toast
    const showNotificationToast = (data, eventName) => {
      const payload = data || {};
      const notificationId = payload._id;

      // Prevent duplicate toasts if we already processed this notification
      if (notificationId && processedNotificationIds.has(notificationId)) {
        console.log(`🔔 Skipping duplicate toast (${eventName}):`, notificationId);
        return;
      }

      if (notificationId) {
        processedNotificationIds.add(notificationId);
        // Clean up after 10 seconds to prevent memory leak
        setTimeout(() => processedNotificationIds.delete(notificationId), 10000);
      }

      console.log(`🔔 Notification received (${eventName}):`, data);

      const isPriority = payload.meta?.priority === "high";
      const title = payload.title || getDefaultTitle(payload.type, payload.meta);
      const actionLabel = payload.type === "document_review_request" ? "Review" : "View";

      // Show toast notification with enhanced styling
      toast({
        title: (
          <div
            className={`flex items-center gap-2 ${
              isPriority ? "text-rose-700" : ""
            }`}
          >
            {isPriority ? (
              <AlertCircle className="h-4 w-4" />
            ) : payload.type === "document_reviewed" ? (
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
            <span>{title}</span>
          </div>
        ),
        description: payload.message || payload.body || "",
        duration: isPriority ? 12000 : 8000,
        variant: "default",
        className: isPriority
          ? "border-l-4 border-l-rose-600 bg-rose-50"
          : payload.type === "document_reviewed"
            ? "border-l-4 border-l-emerald-500"
            : "border-l-4 border-l-blue-500",
        action: payload.link ? {
          label: actionLabel,
          onClick: () => router.push(payload.link)
        } : undefined,
      });

      // Play notification sound (optional)
      try {
        const audio = new Audio('/notification-sound.mp3');
        audio.volume = 0.3;
        audio.play().catch(e => console.log('Could not play sound:', e));
      } catch (e) {
        console.log('Audio not available');
      }

      // Also dispatch event for useNotifications hook (skip to avoid duplicates since realtime-counts-context handles this)
      // Note: We don't dispatch app:notification here because realtime-counts-context already does it
    };

    // Listen for "notification" event (from case.controller, notification.controller)
    socket.on("notification", (data) => {
      showNotificationToast(data, "notification");
    });

    // Also listen for "notification:new" event (from notification.socket.js helper)
    socket.on("notification:new", (data) => {
      console.log("🔔 notification:new received:", data);
      // Extract the nested notification object if present
      const payload = data?.notification || data;
      showNotificationToast(payload, "notification:new");
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket connect_error:", err);
    });

    socket.on("disconnect", (reason) => {
      console.log("🔌 Socket disconnected:", reason);
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        socket.connect();
      }
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log("🔄 Socket reconnected after", attemptNumber, "attempts");
      socket.emit("identify", { userId: String(userId) });
    });

    socket.on("reconnect_error", (err) => {
      console.error("❌ Socket reconnect_error:", err);
    });

    return () => {
      if (socketRef.current) {
        console.log("🔌 Disconnecting socket");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user, router, toast]);

  return null;
}

// Helper function to get default title based on notification type
function getDefaultTitle(type, meta = {}) {
  if (meta?.priority === "high") {
    return "Priority Alert";
  }

  const titles = {
    case_invitation: "📋 Case Invitation",
    case_update: "📄 Case Updated",
    event_reminder: "📅 Event Reminder",
    document_upload: "📄 New Document",
    document_review_request: "📄 Document Review Required",
    document_reviewed: "✅ Document Reviewed",
    system: "🔔 System Notification"
  };

  return titles[type] || "🔔 New Notification";
}
