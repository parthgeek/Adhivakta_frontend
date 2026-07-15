"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Bell, Search, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { MobileNav } from "@/components/admin/shell/mobile-nav"
import { NAV_ITEMS } from "@/lib/admin/navigation"
import { useAuth } from "@/lib/admin/auth-context"
import { titleCase } from "@/lib/admin/format"

export function Topbar({ onOpenPalette, alerts = [] }) {
  const pathname = usePathname()
  const { admin, logout } = useAuth()

  const segments = pathname.split("/").filter(Boolean)
  const rootItem = NAV_ITEMS.find((item) => `/${segments[0]}` === item.href)

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur">
      <MobileNav />

      <Breadcrumb className="hidden sm:block">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/superduper-admin/dashboard">Admin</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {rootItem ? (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {segments.length > 1 ? (
                  <BreadcrumbLink asChild>
                    <Link href={rootItem.href}>{rootItem.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{rootItem.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {segments.length > 1 ? (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="max-w-[180px] truncate">{titleCase(segments[1])}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              ) : null}
            </>
          ) : null}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-1.5">
        <Button variant="outline" size="sm" className="gap-2 text-muted-foreground" onClick={onOpenPalette}>
          <Search className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Search…</span>
          <kbd className="hidden md:inline rounded border bg-muted px-1 text-[10px]">⌘K</kbd>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications (${alerts.length})`}>
              <Bell className="h-4 w-4" />
              {alerts.length > 0 ? (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" aria-hidden />
              ) : null}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Needs attention</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {alerts.length === 0 ? (
              <p className="px-2 py-3 text-sm text-muted-foreground">All clear.</p>
            ) : (
              alerts.map((alert, i) => (
                <DropdownMenuItem key={i} asChild>
                  <Link href={alert.link || "#"} className="flex flex-col items-start gap-0.5">
                    <span className="text-sm">{alert.message}</span>
                  </Link>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-1.5" aria-label="Account menu">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {(admin?.name || "A").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:block text-left">
                <span className="block text-xs font-medium leading-tight">{admin?.name}</span>
                <span className="block text-[10px] text-muted-foreground leading-tight">
                  {titleCase(admin?.adminRole || "admin")}
                </span>
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="font-normal">
              <span className="block text-sm font-medium">{admin?.name}</span>
              <span className="block text-xs text-muted-foreground">{admin?.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
