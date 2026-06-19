"use client";

import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  FileText,
  Users,
  Calendar,
  FolderOpen,
  TrendingUp,
  Settings,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  MessageSquare,
  Scale,
  Monitor,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { useSidebar } from "@/context/sidebar-context";
import { useRealTimeCounts } from "@/context/realtime-counts-context";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: FileText, label: "Cases", path: "/dashboard/cases" },
  { icon: Sparkles, label: "AI Prep Room", path: "/dashboard/ai-prep-room" },
  { icon: Scale, label: "Cause List Search", path: "/dashboard/cause-list/search" },
  { icon: Monitor, label: "Display Board", path: "/dashboard/display-board" },
  {
    icon: Users,
    label: "Clients & Parties",
    path: "/dashboard/clients-parties",
  },
  { icon: Calendar, label: "Hearings", path: "/dashboard/hearings" },
  { icon: Calendar, label: "Calendar", path: "/dashboard/calendar" },
  { icon: FolderOpen, label: "Documents", path: "/dashboard/documents" },
  { icon: MessageSquare, label: "Messages", path: "/dashboard/messages" },
  { icon: Settings, label: "Settings", path: "/dashboard/settings" },
];

const isPathActive = (pathname, href) => {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { collapsed, toggleSidebar } = useSidebar();
  const { counts, activityCounts, resetActivityCount } = useRealTimeCounts();
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  useEffect(() => {
    if (!pathname) return;

    const matchingItem = menuItems.find((item) => isPathActive(pathname, item.path));
    if (!matchingItem || matchingItem.path === "/dashboard/messages") return;

    resetActivityCount(matchingItem.path);
  }, [pathname, resetActivityCount]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const syncUnreadMessageCount = () => {
      const nextCount = Number(localStorage.getItem("unread_messages_count") || "0");
      setUnreadMessagesCount(Number.isFinite(nextCount) ? nextCount : 0);
    };

    syncUnreadMessageCount();
    window.addEventListener("storage", syncUnreadMessageCount);
    window.addEventListener("unreadCountChanged", syncUnreadMessageCount);

    return () => {
      window.removeEventListener("storage", syncUnreadMessageCount);
      window.removeEventListener("unreadCountChanged", syncUnreadMessageCount);
    };
  }, []);

  useEffect(() => {
    setUnreadMessagesCount(Number(counts?.messages || 0));
  }, [counts?.messages]);

  return (
    <div
      className={cn(
        "h-full bg-card border-r transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className="p-4 border-b flex justify-end">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-8 w-8"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = isPathActive(pathname, item.path);
          const showUnreadBadge =
            item.path === "/dashboard/messages" && unreadMessagesCount > 0;
          const activityBadgeCount =
            item.path === "/dashboard/messages"
              ? unreadMessagesCount
              : Number(activityCounts?.[item.path] || 0);
          const showActivityBadge =
            item.path !== "/dashboard/messages" && activityBadgeCount > 0;

          return (
            <Button
              key={item.path}
              variant={isActive ? "default" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 h-11 relative",
                isActive && "bg-primary text-primary-foreground hover:bg-primary/90",
                collapsed && "px-2"
              )}
              onClick={() => router.push(item.path)}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
              {(showUnreadBadge || showActivityBadge) && (
                <span
                  className={cn(
                    "ml-auto min-w-5 h-5 rounded-full px-1.5 text-[11px] font-semibold flex items-center justify-center",
                    isActive
                      ? "bg-white/20 text-primary-foreground"
                      : "bg-primary text-primary-foreground",
                    collapsed && "absolute -top-1 -right-1 min-w-4 h-4 px-1 text-[10px]"
                  )}
                >
                  {activityBadgeCount > 99 ? "99+" : activityBadgeCount}
                </span>
              )}
            </Button>
          );
        })}
      </nav>


    </div>
  );
}
