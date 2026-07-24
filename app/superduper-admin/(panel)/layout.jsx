"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/admin/shell/sidebar"
import { Topbar } from "@/components/admin/shell/topbar"
import { CommandPalette } from "@/components/admin/shell/command-palette"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/lib/admin/auth-context"
import { api } from "@/lib/admin/api"

export default function AdminLayout({ children }) {
  const router = useRouter()
  const { admin, loading, hasPermission } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    if (!loading && !admin) router.replace("/superduper-admin/login")
  }, [admin, loading, router])

  useEffect(() => {
    if (!admin || !hasPermission("dashboard.view")) return
    api
      .get("/admin/dashboard/overview")
      .then(({ data }) => {
        setAlerts(data.alerts || [])
      })
      .catch(() => setAlerts([]))
  }, [admin, hasPermission])

  if (loading || !admin) {
    return (
      <div className="flex min-h-screen">
        <div className="hidden md:block w-60 border-r bg-sidebar p-4 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full bg-sidebar-accent" />
          ))}
        </div>
        <div className="flex-1 p-6 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenPalette={() => setPaletteOpen(true)} alerts={alerts} />
        <main className="flex-1 p-4 md:p-6 space-y-4">{children}</main>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  )
}
