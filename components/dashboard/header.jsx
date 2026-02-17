"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Sidebar from "./sidebar";
import Link from "next/link";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import api from "@/services/api";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

export default function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeout = useRef(null);
  const router = useRouter();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    setNotifLoading(true);
    try {
      const notifs = await api.notifications.getAll();
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n) => !n.read).length);
    } catch (err) {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setNotifLoading(false);
    }
  };
  useEffect(() => {
    fetchNotifications();
  }, []);
  const handleNotificationClick = async (notif) => {
    if (!notif.read) await api.notifications.markAsRead(notif._id || notif.id);
    if (notif.link) router.push(notif.link);
  };

  useEffect(() => {
    if (!isSearchOpen || !searchTerm) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      try {
        // Use the API utility for authenticated search
        const [cases, events, documents] = await Promise.all([
          api.cases.getAll({ search: searchTerm }),
          api.events.getAll({ search: searchTerm }),
          api.documents.getAll({ search: searchTerm }),
        ]);
        const results = [];
        if (cases) results.push(...cases.map((c) => ({ ...c, _type: "case" })));
        if (events)
          results.push(...events.map((e) => ({ ...e, _type: "event" })));
        if (documents)
          results.push(...documents.map((d) => ({ ...d, _type: "document" })));
        setSearchResults(results);
      } catch (err) {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
    return () => clearTimeout(searchTimeout.current);
  }, [searchTerm, isSearchOpen]);

  const getRoleLabel = (role) => {
    if (role === "lawyer") return "Senior Advocate";
    if (role === "client") return "Client";
    return "User";
  };

  return (
    <header className="flex h-16 items-center gap-4 border-b bg-white px-4 lg:px-6 shadow-sm">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Search Bar */}
      <div className="w-full flex-1 relative">
        {isSearchOpen ? (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search cases, clients, advocates..."
              className="w-full bg-gray-50 pl-10 md:w-2/3 lg:w-1/2 h-10 rounded-lg border-gray-200 focus:border-blue-400 focus:ring-blue-400"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
            />
            {(searchLoading || searchResults.length > 0) && (
              <div className="absolute left-0 mt-1 w-full max-w-lg bg-white border rounded-lg shadow-lg z-50">
                {searchLoading && (
                  <div className="p-3 text-center text-muted-foreground text-sm">
                    Searching...
                  </div>
                )}
                {!searchLoading && searchResults.length === 0 && (
                  <div className="p-3 text-center text-muted-foreground text-sm">
                    No results found
                  </div>
                )}
                {!searchLoading && searchResults.length > 0 && (
                  <ul>
                    {searchResults.map((item, idx) => (
                      <li
                        key={item._id || item.id || idx}
                        className="border-b last:border-0"
                      >
                        <Link
                          href={
                            item._type === "case"
                              ? `/dashboard/cases/${item._id || item.id}`
                              : item._type === "event"
                                ? `/dashboard/calendar?event=${item._id || item.id
                                }`
                                : item._type === "document"
                                  ? `/dashboard/documents/${item._id || item.id}`
                                  : "#"
                          }
                          className="flex items-center gap-2 px-4 py-2 hover:bg-muted"
                        >
                          <span className="text-xs font-semibold uppercase text-gray-500">
                            {item._type}
                          </span>
                          <span className="truncate">
                            {item.title ||
                              item.name ||
                              item.caseNumber ||
                              item._id}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-10 w-full justify-start text-gray-400 md:w-2/3 lg:w-1/2 bg-gray-50 border-gray-200 rounded-lg hover:bg-gray-100"
            onClick={() => setIsSearchOpen(true)}
          >
            <Search className="mr-2 h-4 w-4" />
            Search cases, clients, advocates...
          </Button>
        )}
      </div>

      {/* Right Side — Notifications + Profile */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-10 w-10">
              <Bell className="h-5 w-5 text-gray-600" />
              <span className="sr-only">Notifications</span>
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-96 p-0 rounded-xl shadow-xl">
            <div className="p-3 border-b font-semibold">Notifications</div>
            <ul className="max-h-60 overflow-y-auto bg-gray-50 p-2 space-y-1">
              {notifLoading ? (
                <li className="p-4 text-center text-muted-foreground text-sm">
                  Loading...
                </li>
              ) : notifications.length === 0 ? (
                <li className="p-4 text-center text-muted-foreground text-sm">
                  No notifications
                </li>
              ) : (
                notifications.map((n) => (
                  <li
                    key={n._id || n.id}
                    className={`px-4 py-3 bg-white rounded-xl flex items-start gap-2 cursor-pointer hover:bg-gray-50 transition-colors ${!n.read ? "border-l-4 border-l-black" : ""
                      }`}
                    onClick={() => handleNotificationClick(n)}
                  >
                    <span className="text-xs font-semibold uppercase text-gray-500 mt-0.5">
                      {n.type}
                    </span>
                    <div className="flex-1">
                      <div className="text-sm">{n.message}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(n.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </PopoverContent>
        </Popover>

        {/* User Profile */}
        <Link
          href="/dashboard/profile"
          className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-lg px-3 py-1.5 transition-colors"
        >
          <div className="h-9 w-9 rounded-full bg-black flex items-center justify-center text-white font-semibold text-sm shadow-sm">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-gray-900 leading-tight">
              {user?.name || "User"}
            </p>
            <p className="text-xs text-gray-500 leading-tight">
              {getRoleLabel(user?.role)}
            </p>
          </div>
        </Link>
      </div>
    </header>
  );
}
