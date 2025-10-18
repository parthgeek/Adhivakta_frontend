"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, Search, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Sidebar from "./sidebar"
import Link from "next/link"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import api from "@/services/api"
import { useRouter } from "next/navigation"

export default function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const searchTimeout = useRef(null)
  const router = useRouter();
  const [notifications, setNotifications] = useState([])
  const [notifLoading, setNotifLoading] = useState(false)
  const fetchNotifications = async () => {
    setNotifLoading(true)
    try {
      const notifs = await api.notifications.getAll()
      setNotifications(notifs)
    } catch (err) {
      setNotifications([])
    } finally {
      setNotifLoading(false)
    }
  }
  useEffect(() => { fetchNotifications() }, [])
  const handleNotificationClick = async (notif) => {
    if (!notif.read) await api.notifications.markAsRead(notif._id || notif.id)
    if (notif.link) router.push(notif.link)
  }

  useEffect(() => {
    if (!isSearchOpen || !searchTerm) {
      setSearchResults([])
      setSearchLoading(false)
      return
    }
    setSearchLoading(true)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(async () => {
      try {
        // Use the API utility for authenticated search
        const [cases, events, documents] = await Promise.all([
          api.cases.getAll({ search: searchTerm }),
          api.events.getAll({ search: searchTerm }),
          api.documents.getAll({ search: searchTerm }),
        ])
        const results = []
        if (cases) results.push(...cases.map(c => ({...c, _type: "case"})))
        if (events) results.push(...events.map(e => ({...e, _type: "event"})))
        if (documents) results.push(...documents.map(d => ({...d, _type: "document"})))
        setSearchResults(results)
      } catch (err) {
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }, 400)
    return () => clearTimeout(searchTimeout.current)
  }, [searchTerm, isSearchOpen])

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
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

      <div className="w-full flex-1 relative">
        {isSearchOpen ? (
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full bg-background pl-8 md:w-2/3 lg:w-1/3"
              autoFocus
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
            />
            {(searchLoading || searchResults.length > 0) && (
              <div className="absolute left-0 mt-1 w-full max-w-lg bg-white border rounded shadow z-50">
                {searchLoading && <div className="p-3 text-center text-muted-foreground text-sm">Searching...</div>}
                {!searchLoading && searchResults.length === 0 && (
                  <div className="p-3 text-center text-muted-foreground text-sm">No results found</div>
                )}
                {!searchLoading && searchResults.length > 0 && (
                  <ul>
                    {searchResults.map((item, idx) => (
                      <li key={item._id || item.id || idx} className="border-b last:border-0">
                        <Link
                          href={
                            item._type === "case"
                              ? `/dashboard/cases/${item._id || item.id}`
                              : item._type === "event"
                              ? `/dashboard/calendar?event=${item._id || item.id}`
                              : item._type === "document"
                              ? `/dashboard/documents/${item._id || item.id}`
                              : "#"
                          }
                          className="flex items-center gap-2 px-4 py-2 hover:bg-muted"
                        >
                          <span className="text-xs font-semibold uppercase text-gray-500">{item._type}</span>
                          <span className="truncate">
                            {item.title || item.name || item.caseNumber || item._id}
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
            className="h-8 w-full justify-start text-muted-foreground md:w-2/3 lg:w-1/3"
            onClick={() => setIsSearchOpen(true)}
          >
            <Search className="mr-2 h-4 w-4" />
            Search...
          </Button>
        )}
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
            {notifications.some(n => !n.read) && (
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary"></span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0">
          <div className="p-3 border-b font-semibold">Notifications</div>
          <ul className="max-h-60 overflow-y-auto">
            {notifLoading ? (
              <li className="p-4 text-center text-muted-foreground text-sm">Loading...</li>
            ) : notifications.length === 0 ? (
              <li className="p-4 text-center text-muted-foreground text-sm">No notifications</li>
            ) : (
              notifications.map((n) => (
                <li key={n._id || n.id} className={`px-4 py-3 border-b last:border-0 flex items-start gap-2 cursor-pointer ${n.read ? '' : 'bg-blue-50'}`}
                  onClick={() => handleNotificationClick(n)}>
                  <span className="text-xs font-semibold uppercase text-gray-500 mt-0.5">{n.type}</span>
                  <div className="flex-1">
                    <div className="text-sm">{n.message}</div>
                    <div className="text-xs text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </PopoverContent>
      </Popover>
    </header>
  )
}
