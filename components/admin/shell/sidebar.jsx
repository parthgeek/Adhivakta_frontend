"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { PanelLeftClose, PanelLeftOpen, Scale } from "lucide-react"
import { NAV_ITEMS } from "@/lib/admin/navigation"
import { useAuth } from "@/lib/admin/auth-context"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function Sidebar({ collapsed, onToggle }) {
  const pathname = usePathname()
  const { hasPermission } = useAuth()
  const items = NAV_ITEMS.filter((item) => hasPermission(item.permission))

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200",
        collapsed ? "w-14" : "w-60"
      )}
    >
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-3">
        <Scale className="h-5 w-5 text-sidebar-primary shrink-0" aria-hidden />
        {!collapsed ? (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">Adhivakta Admin</p>
          </div>
        ) : null}
      </div>

      <TooltipProvider delayDuration={0}>
        <nav className="flex-1 overflow-y-auto py-2" aria-label="Main navigation">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            const link = (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "mx-2 mb-0.5 flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                {!collapsed ? <span className="truncate">{item.label}</span> : null}
              </Link>
            )
            return collapsed ? (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            ) : (
              link
            )
          })}
        </nav>
      </TooltipProvider>

      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2 border-t border-sidebar-border px-4 py-3 text-xs hover:bg-sidebar-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        {!collapsed ? "Collapse" : null}
      </button>
    </aside>
  )
}
