"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Bell, Search, User, LogOut, Settings, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/auth-context";
import { useRealTimeCounts } from "@/context/realtime-counts-context";
import { useSidebar } from "@/context/sidebar-context";
import { cn } from "@/lib/utils";

export default function Header({ onMenuClick }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { counts } = useRealTimeCounts();
  const { collapsed } = useSidebar();

  const displayName = user?.name || "User";
  const displayRole = user?.role || "member";
  const initials = useMemo(() => {
    const value = displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
    return value || "U";
  }, [displayName]);

  const unreadNotifications = counts?.notifications || 0;

  return (
    <header className="h-24 border-b bg-card shadow-sm flex items-center">
      <div
        className={cn(
          "hidden md:flex h-full items-center px-4 shrink-0",
          collapsed ? "w-28 justify-center" : "w-72"
        )}
      >
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center justify-center overflow-hidden focus:outline-none"
        >
          <img
            src="/images/adhi_logo_main.png"
            alt="Adhivakta Logo"
            className={cn(
              "object-contain transition-all duration-300",
              collapsed
                ? "h-[6.75rem] w-[6.75rem] scale-[1.35]"
                : "h-[6.5rem] w-[6.5rem] scale-[1.15]"
            )}
          />
        </button>
      </div>

      <div className="flex flex-1 items-center px-4 md:px-6 gap-4">
        <div className="flex items-center gap-2 md:hidden">
          {onMenuClick && (
            <Button variant="ghost" size="icon" onClick={onMenuClick}>
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <button
            onClick={() => router.push("/dashboard")}
            className="overflow-hidden focus:outline-none"
          >
            <img
              src="/images/adhi_logo_main.png"
              alt="Adhivakta Logo"
              className="h-14 w-14 scale-[1.1] object-contain"
            />
          </button>
        </div>

        <div className="hidden md:block w-full max-w-[450px] ml-20">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              placeholder="Search cases, clients, advocates..."
              className="pl-12"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4 ml-auto">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => {
              const searchInput = document.querySelector(
                'input[placeholder*="Search"]'
              );
              if (searchInput instanceof HTMLInputElement) {
                searchInput.focus();
              }
            }}
          >
            <Search className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => router.push("/dashboard/notifications")}
          >
            <Bell className="h-5 w-5" />
            {unreadNotifications > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full px-1.5 py-0 flex items-center justify-center text-[10px]"
              >
                {unreadNotifications > 9 ? "9+" : unreadNotifications}
              </Badge>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <span className="text-xs font-semibold">{initials}</span>
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-sm font-medium">{displayName}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {displayRole}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/profile")}
              >
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/settings")}
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
