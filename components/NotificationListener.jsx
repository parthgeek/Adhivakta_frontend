"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AlertCircle, Bell, CheckCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { getNotificationTarget } from "@/lib/notification-link";
import { useAuth } from "@/context/auth-context";
import api from "@/services/api";

const DASHBOARD_NOTIFICATION_POLL_MS = 30000;

export default function NotificationListener() {
  const processedNotificationIdsRef = useRef(new Set());
  const pollingRef = useRef(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();


  
  useEffect(() => {
    const showNotificationToast = (payload = {}) => {
      const notificationId = payload._id;

      if (shouldIgnoreNotificationToast(payload)) {
        return;
      }

      if (
        notificationId &&
        processedNotificationIdsRef.current.has(notificationId)
      ) {
        return;
      }

      if (notificationId) {
        processedNotificationIdsRef.current.add(notificationId);
      }

      const isPriority = payload.meta?.priority === "high";
      const title = payload.title || getDefaultTitle(payload.type, payload.meta);
      const actionLabel = payload.type === "document_review_request" ? "Review" : "View";
      const target = getNotificationTarget(payload);

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
        variant: isPriority ? "destructive" : "default",
        className: isPriority
          ? "border-l-4 border-l-rose-600"
          : payload.type === "document_reviewed"
            ? "border-l-4 border-l-emerald-500"
            : "border-l-4 border-l-[#03234b]",
        action: payload.link ? {
          label: actionLabel,
          onClick: () => router.push(target)
        } : undefined,
      });

      try {
        const audio = new Audio("/notification-sound.mp3");
        audio.volume = 0.3;
        audio.play().catch(() => {});
      } catch {
        // Ignore browsers/environments without audio support.
      }
    };

    const handleNotificationEvent = (event) => {
      showNotificationToast(event?.detail || {});
    };

    window.addEventListener("app:notification", handleNotificationEvent);

    return () => {
      window.removeEventListener("app:notification", handleNotificationEvent);
    };
  }, [router]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !isAuthenticated ||
      !user ||
      !pathname?.startsWith("/dashboard")
    ) {
      return undefined;
    }

    let isCancelled = false;

    const syncDashboardApprovalNotifications = async () => {
      if (pollingRef.current || document.hidden) {
        return;
      }

      pollingRef.current = true;

      try {
        const notificationsResponse = await api.notifications.getAll();
        if (isCancelled) {
          return;
        }

        const notifications = Array.isArray(notificationsResponse)
          ? notificationsResponse
          : [];

        notifications
          .filter(isUnreadApprovalNotification)
          .sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0))
          .slice(0, 3)
          .forEach((notification) => {
            if (!notification?._id) {
              return;
            }

            window.dispatchEvent(
              new CustomEvent("app:notification", { detail: notification })
            );
          });
      } catch (error) {
        console.error("Error polling dashboard notifications:", error);
      } finally {
        pollingRef.current = false;
      }
    };

    syncDashboardApprovalNotifications();

    const intervalId = window.setInterval(
      syncDashboardApprovalNotifications,
      DASHBOARD_NOTIFICATION_POLL_MS
    );

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [isAuthenticated, pathname, user]);

  return null;
}

function getDefaultTitle(type, meta = {}) {
  if (meta?.priority === "high") {
    return "Priority Alert";
  }

  const titles = {
    case_invitation: "Case Invitation",
    case_update: "Case Updated",
    event_reminder: "Event Reminder",
    document_upload: "New Document",
    document_review_request: "Document Review Required",
    document_reviewed: "Document Reviewed",
    system: "System Notification",
  };

  return titles[type] || "New Notification";
}

function shouldIgnoreNotificationToast(payload = {}) {
  const normalizedText = [
    payload.title,
    payload.message,
    payload.body,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  return normalizedText.includes("data loaded successfully");
}

function isUnreadApprovalNotification(payload = {}) {
  return payload.type === "document_review_request" && !payload.read;
}
