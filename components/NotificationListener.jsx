"use client";

import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";

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

    socket.on("notification", (data) => {
      console.log("🔔 Notification received:", data);
      
      const payload = data || {};
      
      // Show toast notification with enhanced styling
      toast({
        title: (
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span>{payload.title || getDefaultTitle(payload.type)}</span>
          </div>
        ),
        description: payload.message || payload.body || "",
        duration: 8000,
        variant: "default",
        className: "border-l-4 border-l-blue-500",
        action: payload.link ? {
          label: "View",
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

      // Also dispatch event for useNotifications hook
      try {
        window.dispatchEvent(new CustomEvent("app:notification", { detail: payload }));
      } catch (err) {
        console.warn("Could not dispatch app:notification event", err);
      }
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
function getDefaultTitle(type) {
  const titles = {
    case_invitation: "📋 Case Invitation",
    case_update: "📄 Case Updated", 
    event_reminder: "📅 Event Reminder",
    document_upload: "📄 New Document",
    system: "🔔 System Notification"
  };
  
  return titles[type] || "🔔 New Notification";
}