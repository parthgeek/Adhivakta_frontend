"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { CalendarDays, AlertTriangle, Link2Off, CalendarClock, ChevronLeft, ChevronRight, Printer } from "lucide-react"
import { PageHeader } from "@/components/admin/shared/page-header"
import { FilterBar } from "@/components/admin/shared/filter-bar"
import { DataTable } from "@/components/admin/shared/data-table"
import { StatusBadge } from "@/components/admin/shared/status-badge"
import { ExportButton } from "@/components/admin/shared/export-button"
import { PermissionGuard } from "@/components/admin/shared/permission-guard"
import { MetricCard } from "@/components/admin/shared/metric-card"
import { ConfirmActionDialog } from "@/components/admin/shared/confirm-action-dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useServerTable } from "@/hooks/use-admin-table"
import { api, buildQuery } from "@/lib/admin/api"
import { useAuth } from "@/lib/admin/auth-context"
import { formatDateTime, formatNumber } from "@/lib/admin/format"

function CalendarView() {
  const [anchor, setAnchor] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [events, setEvents] = useState(null)

  useEffect(() => {
    const from = anchor.toISOString().slice(0, 10)
    const to = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).toISOString().slice(0, 10)
    setEvents(null)
    api.get(`/admin/hearings/calendar${buildQuery({ from, to })}`)
      .then(({ data }) => setEvents(data))
      .catch(() => setEvents([]))
  }, [anchor])

  const byDay = useMemo(() => {
    const map = {}
    for (const event of events || []) {
      const key = new Date(event.start).getDate()
      ;(map[key] = map[key] || []).push(event)
    }
    return map
  }, [events])

  const daysInMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate()
  const firstWeekday = new Date(anchor.getFullYear(), anchor.getMonth(), 1).getDay()
  const monthLabel = anchor.toLocaleString("en-IN", { month: "long", year: "numeric" })

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">{monthLabel}</h2>
        <div className="flex gap-1 print:hidden">
          <Button variant="outline" size="sm" onClick={() => setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1))} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1))} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-1 h-4 w-4" /> Print
          </Button>
        </div>
      </div>
      {!events ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <div className="grid grid-cols-7 gap-px rounded-lg border bg-border overflow-hidden text-xs">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="bg-muted px-2 py-1.5 font-medium text-center">{d}</div>
          ))}
          {Array.from({ length: firstWeekday }).map((_, i) => (
            <div key={`pad-${i}`} className="bg-card min-h-[90px]" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dayEvents = byDay[day] || []
            return (
              <div key={day} className="bg-card min-h-[90px] p-1.5 space-y-1">
                <p className="text-muted-foreground">{day}</p>
                {dayEvents.slice(0, 3).map((event) => (
                  <Link
                    key={event._id}
                    href={`/superduper-admin/hearings?q=${encodeURIComponent(event.caseNumber || event.title)}`}
                    className="block truncate rounded bg-primary/10 px-1 py-0.5 text-primary hover:bg-primary/20"
                    title={`${event.title} — ${event.caseTitle || ""}`}
                  >
                    {event.title}
                  </Link>
                ))}
                {dayEvents.length > 3 ? <p className="text-muted-foreground">+{dayEvents.length - 3} more</p> : null}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function HearingsContent() {
  const { hasPermission } = useAuth()
  const table = useServerTable({ endpoint: "/admin/hearings", defaultSort: "-start" })
  const [stats, setStats] = useState(null)
  const [remindTarget, setRemindTarget] = useState(null)

  useEffect(() => {
    api.get("/admin/hearings/stats").then(({ data }) => setStats(data)).catch(() => {})
  }, [])

  const columns = [
    { key: "title", label: "Hearing", sortable: true, render: (h) => (
      <div className="max-w-[240px]">
        <p className="truncate font-medium">{h.title}</p>
        <p className="truncate text-xs text-muted-foreground">{h.caseTitle || "No linked case"}{h.judge ? ` · ${h.judge}` : ""}</p>
      </div>
    )},
    { key: "start", label: "Scheduled", sortable: true, render: (h) => formatDateTime(h.start) },
    { key: "status", label: "Status", sortable: true, render: (h) => <StatusBadge status={h.status} /> },
    { key: "location", label: "Location", render: (h) => <span className="max-w-[160px] truncate block">{h.isVirtual ? "Virtual" : h.location || "—"}</span> },
    { key: "reminderSummary", label: "Reminders", render: (h) => (
      <span className="text-xs">
        {h.reminderSummary?.sent || 0}/{h.reminderSummary?.configured || 0} sent
        {h.reminderSummary?.lastSentAt ? <span className="text-muted-foreground"> · {formatDateTime(h.reminderSummary.lastSentAt)}</span> : null}
      </span>
    )},
    { key: "createdBy", label: "Owner", render: (h) => h.createdBy?.email || "—" },
    ...(hasPermission("hearings.manage")
      ? [{
          key: "_actions", label: "",
          render: (h) => (
            <Button size="sm" variant="outline" className="h-7" onClick={(e) => { e.stopPropagation(); setRemindTarget(h) }}>
              Remind now
            </Button>
          ),
        }]
      : []),
  ]

  return (
    <div className="space-y-4">
      <PageHeader title="Hearings & Calendar" description="Every hearing across the platform, reminder delivery and schedule health">
        <ExportButton endpoint="/admin/hearings/export" filename="hearings-export.csv" filters={table.filters} permission="hearings.view" />
      </PageHeader>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Hearing metrics">
        <MetricCard title="Upcoming (7d)" value={formatNumber(stats?.upcoming7d)} icon={CalendarDays} loading={!stats} />
        <MetricCard title="Overdue / stale" value={formatNumber(stats?.overdue)} icon={AlertTriangle} loading={!stats} href="/superduper-admin/hearings?overdue=true" tone={stats?.overdue > 0 ? "amber" : undefined} />
        <MetricCard title="Missing case link" value={formatNumber(stats?.missingCase)} icon={Link2Off} loading={!stats} tone={stats?.missingCase > 0 ? "amber" : undefined} />
        <MetricCard title="Adjourned" value={formatNumber(stats?.byStatus?.find((s) => s._id === "adjourned")?.count || 0)} icon={CalendarClock} loading={!stats} href="/superduper-admin/hearings?status=adjourned" />
      </section>

      <Tabs defaultValue="list">
        <TabsList className="print:hidden">
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="space-y-4 pt-2">
          <FilterBar
            table={table}
            searchPlaceholder="Search title, case, judge or location…"
            dateRange
            selects={[
              { key: "status", label: "Status", options: ["scheduled", "confirmed", "completed", "adjourned", "cancelled"] },
              { key: "overdue", label: "Health", options: [{ value: "true", label: "Overdue only" }] },
            ]}
          />
          <DataTable columns={columns} table={table} emptyTitle="No hearings match these filters" />
          <p className="text-xs text-muted-foreground">
            Reminder counts reflect the platform's email/push reminder flags. Per-channel delivery receipts (delivered /
            failed / retried) require provider webhook storage that is not implemented yet.
          </p>
        </TabsContent>
        <TabsContent value="calendar" className="pt-2">
          <CalendarView />
        </TabsContent>
      </Tabs>

      {remindTarget ? (
        <ConfirmActionDialog
          open={!!remindTarget}
          onOpenChange={(open) => !open && setRemindTarget(null)}
          title="Send manual reminder"
          description={`In-app notifications will be sent now to the owner and participants of "${remindTarget.title}".`}
          requireReason
          confirmLabel="Send reminder"
          onConfirm={async (reason) => {
            const { data } = await api.post(`/admin/hearings/${remindTarget._id}/remind`, { reason })
            toast.success(`Reminder sent to ${data.notified} recipients`)
            table.refresh()
          }}
        />
      ) : null}
    </div>
  )
}

export default function HearingsPage() {
  return (
    <PermissionGuard permission="hearings.view" showDenied>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <HearingsContent />
      </Suspense>
    </PermissionGuard>
  )
}
