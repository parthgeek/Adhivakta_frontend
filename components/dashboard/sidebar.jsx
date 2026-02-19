"use client";

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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { useSidebar } from "@/context/sidebar-context";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: FileText, label: "Cases", path: "/dashboard/cases" },
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

  return (
    <div
      className={cn(
        "h-full bg-card border-r transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-56"
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
          return (
            <Button
              key={item.path}
              variant={isActive ? "default" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 h-11",
                isActive && "bg-[#03234b] text-white hover:bg-[#03234b]",
                collapsed && "px-2"
              )}
              onClick={() => router.push(item.path)}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Button>
          );
        })}
      </nav>


    </div>
  );
}
