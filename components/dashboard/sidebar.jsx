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
  Gavel,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useSidebar } from "@/context/sidebar-context";
import { useRealTimeCounts } from "@/context/realtime-counts-context";
import { useLanguage } from "@/context/language-context";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const getLawyerNavItems = (counts, t) => [
  {
    name: t.dashboard,
    href: "/dashboard",
    icon: LayoutDashboard,
    tooltip: t.dashboard,
  },
  {
    name: t.cases,
    href: "/dashboard/cases",
    icon: FileText,
    tooltip: t.cases,
  },
  {
    name: t.clientsParties || "Clients & Parties",
    href: "/dashboard/clients-parties",
    icon: Users,
    tooltip: t.clientsParties || "Clients & Parties",
  },
  {
    name: "Hearings",
    href: "/dashboard/calendar",
    icon: Gavel,
    tooltip: "Hearings",
    badge: counts.events,
  },
  {
    name: t.calendar || "Calendar",
    href: "/dashboard/calendar",
    icon: Calendar,
    tooltip: t.calendar || "Calendar",
  },
  {
    name: "Alerts",
    href: "/dashboard/notifications",
    icon: AlertTriangle,
    tooltip: "Alerts",
    badge: counts.notifications,
  },
  {
    name: t.documents,
    href: "/dashboard/documents",
    icon: FolderOpen,
    tooltip: t.documents,
  },
  {
    name: t.reports || "Reports",
    href: "/dashboard/reports",
    icon: BarChart3,
    tooltip: t.reports || "Reports",
  },
  {
    name: t.messages || "Messages",
    href: "/dashboard/messages",
    icon: MessageSquare,
    tooltip: t.messages || "Messages",
    badge: counts.messages,
  },
];

const getClientNavItems = (counts, t) => [
  {
    name: t.dashboard,
    href: "/dashboard",
    icon: LayoutDashboard,
    tooltip: t.dashboard,
  },
  {
    name: t.myCases || "My Cases",
    href: "/dashboard/cases",
    icon: FileText,
    tooltip: t.myCases || "My Cases",
  },
  {
    name: t.documents,
    href: "/dashboard/documents",
    icon: FolderOpen,
    tooltip: t.documents,
  },
  {
    name: t.calendar || "Calendar",
    href: "/dashboard/calendar",
    icon: Calendar,
    tooltip: t.calendar || "Calendar",
    badge: counts.events,
  },
  {
    name: t.myLawyers || "My Lawyers",
    href: "/dashboard/lawyers",
    icon: Briefcase,
    tooltip: t.myLawyers || "My Lawyers",
  },
  {
    name: t.notifications || "Notifications",
    href: "/dashboard/notifications",
    icon: Bell,
    tooltip: t.notifications || "Notifications",
    badge: counts.notifications,
  },
  {
    name: t.messages || "Messages",
    href: "/dashboard/messages",
    icon: MessageSquare,
    tooltip: t.messages || "Messages",
    badge: counts.messages,
  },
];

const getBottomNavItems = (t) => [
  {
    name: t.profile || "Profile",
    href: "/dashboard/profile",
    icon: User,
    tooltip: t.profile || "Profile",
  },
  {
    name: t.settings || "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    tooltip: t.settings || "Settings",
  },
  {
    name: t.help || "Help",
    href: "/dashboard/help",
    icon: HelpCircle,
    tooltip: t.help || "Help",
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const { collapsed, toggleSidebar } = useSidebar();
  const { counts } = useRealTimeCounts();
  const { t } = useLanguage();

  const isLawyer = user?.role === "lawyer";
  const navItems = isLawyer
    ? getLawyerNavItems(counts, t)
    : getClientNavItems(counts, t);

  const bottomNavItems = getBottomNavItems(t);

  return (
    <TooltipProvider>
      <div
        className={cn(
          "flex h-full flex-col transition-all duration-300 ease-in-out",
          collapsed ? "w-16" : "w-64",
          "bg-white text-gray-700 border-r border-gray-200"
        )}
      >
        {/* Logo Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-3">
              <img
                src="/adhi_logo_main.png"
                alt="Adhivakta Logo"
                className="h-10 w-10 object-contain"
              />
              <span
                className="text-lg font-semibold text-gray-900 tracking-wide uppercase"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Adhivakta
              </span>
            </Link>
          )}
          {collapsed && (
            <div className="flex justify-center w-full">
              <img
                src="/adhi_logo_main.png"
                alt="Adhivakta"
                className="h-9 w-9 object-contain"
              />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8 ml-auto text-gray-400 hover:text-gray-900 hover:bg-gray-100"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle sidebar</span>
          </Button>
        </div>

        {/* Main Navigation */}
        <div className="flex-1 overflow-auto py-3">
          <TooltipProvider>
            <nav className="grid gap-0.5 px-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Tooltip key={item.name + item.href}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 relative",
                          isActive
                            ? "bg-[#1a2332] text-white font-semibold shadow-lg"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                          collapsed ? "justify-center" : "gap-3"
                        )}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {!collapsed && <span>{item.name}</span>}
                        {!collapsed && item.badge > 0 && (
                          <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center font-semibold">
                            {item.badge}
                          </span>
                        )}
                        {collapsed && item.badge > 0 && (
                          <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
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
                );
              })}
            </nav>
          </TooltipProvider>
        </div>

        {/* Bottom Navigation */}
        <div className="border-t border-gray-200">
          <TooltipProvider>
            <nav className="grid gap-0.5 px-2 py-2">
              {bottomNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                          isActive
                            ? "bg-[#1a2332] text-white font-semibold shadow-lg"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
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
                );
              })}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                      collapsed ? "justify-center" : "gap-3"
                    )}
                    onClick={logout}
                  >
                    <LogOut className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && <span>{t.logout || "Logout"}</span>}
                  </Button>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right" className="ml-2">
                    {t.logout || "Logout"}
                  </TooltipContent>
                )}
              </Tooltip>
            </nav>
          </TooltipProvider>
        </div>
      </div>
    </TooltipProvider>
  );
}
