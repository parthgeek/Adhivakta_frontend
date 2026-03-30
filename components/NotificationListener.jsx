"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Bell, CheckCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function NotificationListener() {
  const processedNotificationIdsRef = useRef(new Set());
  const router = useRouter();

  useEffect(() => {
    const showNotificationToast = (event) => {
      const payload = event?.detail || {};
      const notificationId = payload._id;

      if (
        notificationId &&
        processedNotificationIdsRef.current.has(notificationId)
      ) {
        return;
      }

      if (notificationId) {
        processedNotificationIdsRef.current.add(notificationId);
        window.setTimeout(() => {
          processedNotificationIdsRef.current.delete(notificationId);
        }, 10000);
      }

      const isPriority = payload.meta?.priority === "high";
      const title = payload.title || getDefaultTitle(payload.type, payload.meta);
      const actionLabel = payload.type === "document_review_request" ? "Review" : "View";

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
        action: payload.link
          ? {
              label: actionLabel,
              onClick: () => router.push(payload.link),
            }
          : undefined,
      });

      try {
        const audio = new Audio("/notification-sound.mp3");
        audio.volume = 0.3;
        audio.play().catch(() => {});
      } catch {
        // Ignore browsers/environments without audio support.
      }
    };

    window.addEventListener("app:notification", showNotificationToast);

    return () => {
      window.removeEventListener("app:notification", showNotificationToast);
    };
  }, [router]);

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
