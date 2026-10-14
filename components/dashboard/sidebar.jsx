"use client";

import { useEffect, useMemo, useState } from "react";
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
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { useSidebar } from "@/context/sidebar-context";
import { useRealTimeCounts } from "@/context/realtime-counts-context";
import { useAuth } from "@/context/auth-context";

const menuItems = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "/dashboard",
    tour: "dashboard-nav",
    description: "Practice overview — case stats, today's hearings and alerts.",
  },
  {
    icon: FileText,
    label: "Cases",
    path: "/dashboard/cases",
    tour: "cases-nav",
    description:
      "Case register — every matter with status, stage and next hearing.",
  },
  {
    icon: Sparkles,
    label: "AI Prep Room",
    path: "/dashboard/ai-prep-room",
    tour: "ai-prep-nav",
    description: "AI case briefs, weakness analysis and hearing practice.",
  },
  {
    icon: Scale,
    label: "Cause List Search",
    path: "/dashboard/cause-list/search",
    tour: "cause-list-nav",
    description:
      "Today's court cause list and the entries matching your cases.",
  },
  {
    icon: Monitor,
    label: "Display Board",
    path: "/dashboard/display-board",
    tour: "display-board-nav",
    description: "Live court display board — which case is being heard now.",
  },
  {
    icon: Users,
    label: "Clients & Parties",
    path: "/dashboard/clients-parties",
    tour: "clients-nav",
    description: "Clients, opposing parties and their linked matters.",
  },
  {
    icon: Calendar,
    label: "Hearings",
    path: "/dashboard/hearings",
    tour: "hearings-nav",
    description: "Hearing schedule and proceedings recorded after each date.",
  },
  {
    icon: Calendar,
    label: "Calendar",
    path: "/dashboard/calendar",
    tour: "calendar-nav",
    description: "Month view of hearings, deadlines and personal events.",
  },
  {
    icon: FolderOpen,
    label: "Documents",
    path: "/dashboard/documents",
    tour: "documents-nav",
    description: "Case files, orders and judgments stored in your workspace.",
  },
  {
    icon: MessageSquare,
    label: "Messages",
    path: "/dashboard/messages",
    tour: "messages-nav",
    description: "Chats with clients and your legal team, per case.",
  },
  {
    icon: Settings,
    label: "Settings",
    path: "/dashboard/settings",
    tour: "settings-nav",
    description: "Profile, workspace, notification and billing settings.",
  },
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
  const { user } = useAuth();
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const visibleMenuItems = useMemo(
    () =>
      user?.role === "organization_admin"
        ? [
            ...menuItems.slice(0, 1),
            {
              icon: Building2,
              label: "Organization",
              path: "/dashboard/organization",
              tour: "organization-nav",
              description: "Members, roles and organization-wide case access.",
            },
            ...menuItems.slice(1),
          ]
        : menuItems,
    [user?.role],
  );

  useEffect(() => {
    if (!pathname) return;

    const matchingItem = visibleMenuItems.find((item) =>
      isPathActive(pathname, item.path),
    );
    if (!matchingItem || matchingItem.path === "/dashboard/messages") return;

    resetActivityCount(matchingItem.path);
  }, [pathname, resetActivityCount, visibleMenuItems]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const syncUnreadMessageCount = () => {
      const nextCount = Number(
        localStorage.getItem("unread_messages_count") || "0",
      );
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
        collapsed ? "w-16" : "w-60",
      )}
      data-tour="sidebar-nav"
    >
      <div className="p-4 border-b flex justify-end">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-8 w-8"
          data-tour="sidebar-toggle"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <TooltipProvider delayDuration={250}>
        <nav className="flex-1 p-4 space-y-2">
          {visibleMenuItems.map((item) => {
            const isActive = isPathActive(pathname, item.path);
            const showUnreadBadge =
              item.path === "/dashboard/messages" && unreadMessagesCount > 0;
            const activityBadgeCount =
              item.path === "/dashboard/messages"
                ? unreadMessagesCount
                : Number(activityCounts?.[item.path] || 0);
            const showActivityBadge =
              item.path !== "/dashboard/messages" && activityBadgeCount > 0;

            const navButton = (
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-11 relative",
                  isActive &&
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                  collapsed && "px-2",
                )}
                onClick={() => router.push(item.path)}
                data-tour={item.tour}
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
                      collapsed &&
                        "absolute -top-1 -right-1 min-w-4 h-4 px-1 text-[10px]",
                    )}
                  >
                    {activityBadgeCount > 99 ? "99+" : activityBadgeCount}
                  </span>
                )}
              </Button>
            );

            return (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>{navButton}</TooltipTrigger>
                <TooltipContent side="right" className="max-w-[15rem]">
                  <p className="font-medium">{item.label}</p>
                  {item.description && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
      </TooltipProvider>
    </div>
  );
}
