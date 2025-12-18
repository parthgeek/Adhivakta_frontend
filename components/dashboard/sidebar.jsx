"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Calendar,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Users,
  Briefcase,
  BarChart3,
  User,
  Bell,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useSidebar } from "@/context/sidebar-context";
import { useRealTimeCounts } from "@/context/realtime-counts-context";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const getLawyerNavItems = (counts) => [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    tooltip: "Dashboard",
  },
  {
    name: "Cases",
    href: "/dashboard/cases",
    icon: FileText,
    tooltip: "Cases",
  },
  {
    name: "Documents",
    href: "/dashboard/documents",
    icon: FolderOpen,
    tooltip: "Documents",
  },
  {
    name: "Calendar",
    href: "/dashboard/calendar",
    icon: Calendar,
    tooltip: "Calendar",
    badge: counts.events,
  },
  {
    name: "Clients & Parties",
    href: "/dashboard/clients-parties",
    icon: Users,
    tooltip: "Clients & Parties",
  },
  {
    name: "Reports",
    href: "/dashboard/reports",
    icon: BarChart3,
    tooltip: "Reports & Analytics",
  },
  {
    name: "Notifications",
    href: "/dashboard/notifications",
    icon: Bell,
    tooltip: "Notifications",
    badge: counts.notifications,
  },
  {
    name: "Messages",
    href: "/dashboard/messages",
    icon: MessageSquare,
    tooltip: "Messages",
    badge: counts.messages,
  },
];

const getClientNavItems = (counts) => [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    tooltip: "Dashboard",
  },
  {
    name: "My Cases",
    href: "/dashboard/cases",
    icon: FileText,
    tooltip: "My Cases",
  },
  {
    name: "Documents",
    href: "/dashboard/documents",
    icon: FolderOpen,
    tooltip: "Documents",
  },
  {
    name: "Calendar",
    href: "/dashboard/calendar",
    icon: Calendar,
    tooltip: "Calendar",
    badge: counts.events,
  },
  {
    name: "My Lawyers",
    href: "/dashboard/lawyers",
    icon: Briefcase,
    tooltip: "My Lawyers",
  },
  {
    name: "Notifications",
    href: "/dashboard/notifications",
    icon: Bell,
    tooltip: "Notifications",
    badge: counts.notifications,
  },
  {
    name: "Messages",
    href: "/dashboard/messages",
    icon: MessageSquare,
    tooltip: "Messages",
    badge: counts.messages,
  },
];

const bottomNavItems = [
  {
    name: "Profile",
    href: "/dashboard/profile",
    icon: User,
    tooltip: "Profile",
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    tooltip: "Settings",
  },
  {
    name: "Help",
    href: "/dashboard/help",
    icon: HelpCircle,
    tooltip: "Help",
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const { collapsed, toggleSidebar } = useSidebar();
  const { counts } = useRealTimeCounts();

  const isLawyer = user?.role === "lawyer";
  const navItems = isLawyer
    ? getLawyerNavItems(counts)
    : getClientNavItems(counts);

  return (
     <TooltipProvider> 
    <div
      className={cn(
        "flex h-full flex-col border-r bg-background transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-14 items-center justify-between border-b px-4">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/adhi_logo_main.png"
              alt="Adhivakta Logo"
              className="h-12 w-12 object-contain"
            />
            <span className="text-lg font-semibold">Adhivakta</span>
          </Link>
        )}
        {collapsed && (
          <div className="flex justify-center w-full">
            <img
              src="/adhi_logo_main.png"
              alt="Adhivakta"
              className="h-10 w-10 object-contain"
            />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-8 w-8 ml-auto"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </div>

      <div className="flex-1 overflow-auto py-2">
        <TooltipProvider>
          <nav className="grid gap-1 px-2">
            {navItems.map((item) => (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors relative",
                      pathname === item.href
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted",
                      collapsed ? "justify-center" : "gap-3"
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && <span>{item.name}</span>}
                    {!collapsed && item.badge > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                        {item.badge}
                      </span>
                    )}
                    {collapsed && item.badge > 0 && (
                      <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                        {item.badge > 9 ? "9+" : item.badge}
                      </span>
                    )}
                  </Link>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right" className="ml-2">
                    {item.tooltip || item.name}
                  </TooltipContent>
                )}
              </Tooltip>
            ))}
          </nav>
        </TooltipProvider>
      </div>

      <div className="border-t">
        <TooltipProvider>
          <nav className="grid gap-1 px-2 py-2">
            {bottomNavItems.map((item) => (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      pathname === item.href
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted",
                      collapsed ? "justify-center" : "gap-3"
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && <span>{item.name}</span>}
                  </Link>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right" className="ml-2">
                    {item.tooltip || item.name}
                  </TooltipContent>
                )}
              </Tooltip>
            ))}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
                    collapsed ? "justify-center" : "gap-3"
                  )}
                  onClick={logout}
                >
                  <LogOut className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span>Sign out</span>}
                </Button>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" className="ml-2">
                  Sign out
                </TooltipContent>
              )}
            </Tooltip>
          </nav>
        </TooltipProvider>
      </div>

      {/* User Profile Section with Total Count Badge */}
      {!collapsed && (
        <div className="border-t p-4">
          <div className="flex items-center gap-3 relative">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium relative">
              {user?.name?.charAt(0) || "U"}
              {counts.total > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {counts.total > 99 ? "99+" : counts.total}
                </span>
              )}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-medium truncate">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.role === "lawyer" ? "Lawyer" : "Client"}
              </p>
            </div>
          </div>
        </div>
      )}
      {collapsed && (
        <div className="border-t p-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex justify-center cursor-pointer">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm relative">
                  {user?.name?.charAt(0) || "U"}
                  {counts.total > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {counts.total > 9 ? "9+" : counts.total}
                    </span>
                  )}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="ml-2">
              <div className="text-sm">
                <p className="font-medium">{user?.name || "User"}</p>
                {counts.total > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {counts.total} new update{counts.total > 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
    </TooltipProvider>
  );
}