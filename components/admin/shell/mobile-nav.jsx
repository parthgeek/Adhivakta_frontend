"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, Scale } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { NAV_ITEMS } from "@/lib/admin/navigation"
import { useAuth } from "@/lib/admin/auth-context"
import { cn } from "@/lib/utils"

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { hasPermission } = useAuth()
  const items = NAV_ITEMS.filter((item) => hasPermission(item.permission))

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0 bg-sidebar text-sidebar-foreground border-sidebar-border">
        <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
          <Scale className="h-5 w-5 text-sidebar-primary" aria-hidden />
          <SheetTitle className="text-sm font-semibold text-white">Adhivakta Admin</SheetTitle>
        </div>
        <nav className="py-2" aria-label="Main navigation">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "mx-2 mb-0.5 flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "hover:bg-sidebar-accent/60"
                )}
              >
                <item.icon className="h-4 w-4" aria-hidden />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
