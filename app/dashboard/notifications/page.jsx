"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Bell,
  AlertCircle,
  CheckCircle,
  Clock,
  Info,
  Trash2,
  Check,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useNotifications } from "@/hooks/UseNotifications";
import { getNotificationTarget } from "@/lib/notification-link";

export default function NotificationsPageEnhanced() {
  const router = useRouter();
  const {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications();

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification._id);
    }
    if (notification.link) {
      router.push(getNotificationTarget(notification));
    }
  };

  const handleMarkAllAsRead = async () => {
    const result = await markAllAsRead();
    if (result) {
      toast.success("All notifications marked as read");
    } else {
      toast.error("Failed to mark all as read");
    }
  };

  const handleClearAll = async () => {
    if (window.confirm("Are you sure you want to delete all notifications?")) {
      const result = await clearAll();
      if (result) {
        toast.success("All notifications cleared");
      } else {
        toast.error("Failed to clear notifications");
      }
    }
  };

  const handleDelete = async (e, notificationId) => {
    e.stopPropagation();
    const result = await deleteNotification(notificationId);
    if (result.success) {
      toast.success("Notification deleted");
    } else {
      toast.error("Failed to delete notification");
    }
  };

  const isPriorityNotification = (notification) =>
    notification?.meta?.priority === "high";

  const getIcon = (notification) => {
    const type = notification?.type;
    const isPriority = isPriorityNotification(notification);

    switch (type) {
      case "case_invitation":
        return <Bell className="h-5 w-5 text-indigo-500" />;
      case "case":
        return <Info className="h-5 w-5 text-indigo-500" />;
      case "event":
        return <Clock className="h-5 w-5 text-amber-500" />;
      case "document":
      case "document_upload":
        return <AlertCircle className="h-5 w-5 text-violet-500" />;
      case "document_review_request":
        return (
          <AlertCircle
            className={`h-5 w-5 ${isPriority ? "text-rose-600" : "text-amber-500"}`}
          />
        );
      case "document_reviewed":
        return <CheckCircle className="h-5 w-5 text-emerald-600" />;
      case "reminder":
        return <Clock className="h-5 w-5 text-rose-500" />;
      default:
        return <Info className="h-5 w-5 text-slate-500" />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Skeleton Component for Notifications
  const NotificationsSkeleton = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Skeleton */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-9 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-9 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Notifications List Skeleton */}
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="flex items-start gap-4 p-4 rounded-xl border bg-white border-slate-200"
            >
              <div className="h-9 w-9 bg-gray-200 rounded animate-pulse flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                  {i < 3 && <div className="h-5 w-12 bg-gray-200 rounded animate-pulse"></div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <NotificationsSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold text-slate-900">
              Notifications
            </h1>
            <p className="text-slate-600 text-sm">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            </p>
          </div>

          {notifications.length > 0 && (
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button
                  onClick={handleMarkAllAsRead}
                  variant="outline"
                  className="flex items-center gap-2 border-slate-200 hover:bg-slate-50 text-slate-700"
                >
                  <CheckCircle className="h-4 w-4" />
                  Mark all read
                </Button>
              )}
              <Button
                onClick={handleClearAll}
                variant="outline"
                className="flex items-center gap-2 border-rose-200 hover:bg-rose-50 text-rose-600"
              >
                <Trash2 className="h-4 w-4" />
                Clear all
              </Button>
            </div>
          )}
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">
              No notifications
            </h3>
            <p className="text-slate-600 text-sm">You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => {
              const isPriority = isPriorityNotification(notification);

              return (
                <div
                  key={notification._id}
                  className={`group flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                    isPriority
                      ? notification.read
                        ? "bg-rose-50/40 border-rose-200 hover:border-rose-300 hover:shadow-sm"
                        : "bg-rose-50 border-rose-200 hover:border-rose-300 hover:shadow-sm"
                      : notification.read
                        ? "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
                        : "bg-indigo-50/50 border-indigo-200/50 hover:border-indigo-300 hover:shadow-sm"
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div
                    className={`mt-0.5 p-2 rounded-lg ${
                      isPriority
                        ? "bg-rose-100"
                        : notification.read
                          ? "bg-slate-100"
                          : "bg-white"
                    }`}
                  >
                    {getIcon(notification)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm leading-relaxed ${
                        notification.read ? "text-slate-700" : "text-slate-900 font-medium"
                      }`}
                    >
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <p className="text-xs text-slate-500">
                        {formatDate(notification.createdAt)}
                      </p>
                      {isPriority && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-rose-100 text-rose-700">
                          Priority
                        </span>
                      )}
                      {!notification.read && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-100 text-indigo-700">
                          New
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notification.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification._id);
                        }}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Mark as read"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDelete(e, notification._id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
