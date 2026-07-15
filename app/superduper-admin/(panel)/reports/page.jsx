"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Download, FileBarChart } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/admin/shared/page-header"
import { PermissionGuard } from "@/components/admin/shared/permission-guard"
import { buildQuery, downloadCsv } from "@/lib/admin/api"
import { useAuth } from "@/lib/admin/auth-context"

// Each report reuses a filtered admin export endpoint; permission-aware
// field redaction happens server-side (sensitive fields are never included).
const REPORTS = [
  { key: "users", title: "Users report", description: "Accounts with role, status, verification and subscription state.", endpoint: "/admin/users/export", filename: "users-report.csv", permission: "users.view" },
  { key: "cases", title: "Cases report", description: "Case registry with type, status, priority, court and owner.", endpoint: "/admin/cases/export", filename: "cases-report.csv", permission: "cases.view" },
  { key: "documents", title: "Documents report", description: "Files with approval state, size, case and uploader.", endpoint: "/admin/documents/export", filename: "documents-report.csv", permission: "documents.view" },
  { key: "hearings", title: "Hearings report", description: "Hearings with schedule, status, judge and owner.", endpoint: "/admin/hearings/export", filename: "hearings-report.csv", permission: "hearings.view" },
  { key: "courts", title: "Court directory report", description: "Court-wise directory entries and import freshness.", endpoint: "/admin/courts/export", filename: "courts-report.csv", permission: "courts.view" },
  { key: "ai", title: "AI usage report", description: "Daily aggregate NyaAI conversations, messages and active users.", endpoint: "/admin/ai/export", filename: "ai-usage-report.csv", permission: "ai.view" },
  { key: "billing", title: "Billing report", description: "Subscriptions with plan, status, period and start date.", endpoint: "/admin/billing/export", filename: "billing-report.csv", permission: "billing.view" },
  { key: "activity", title: "Activity / audit report", description: "Administrative and security audit trail (auditors only).", endpoint: "/admin/audit/export", filename: "audit-report.csv", permission: "audit.export" },
]

function ReportCard({ report, range }) {
  const [busy, setBusy] = useState(false)
  const run = async () => {
    setBusy(true)
    try {
      await downloadCsv(`${report.endpoint}${buildQuery(range)}`, report.filename)
      toast.success(`${report.title} downloaded`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileBarChart className="h-4 w-4 text-muted-foreground" aria-hidden />
          {report.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-end justify-between gap-2">
        <p className="text-sm text-muted-foreground">{report.description}</p>
        <Button size="sm" variant="outline" onClick={run} disabled={busy}>
          <Download className="mr-1.5 h-4 w-4" />
          {busy ? "Preparing…" : "CSV"}
        </Button>
      </CardContent>
    </Card>
  )
}

export default function ReportsPage() {
  const { hasPermission } = useAuth()
  const [range, setRange] = useState({ from: "", to: "" })
  const visible = REPORTS.filter((r) => hasPermission(r.permission))

  return (
    <PermissionGuard permission="reports.view" showDenied>
      <div className="space-y-4">
        <PageHeader title="Reports & Exports" description="Generate filtered CSV exports. Every download is audit-logged." />

        <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-3">
          <div className="space-y-1">
            <Label htmlFor="report-from">From</Label>
            <Input id="report-from" type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} className="w-[160px]" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="report-to">To</Label>
            <Input id="report-to" type="date" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} className="w-[160px]" />
          </div>
          <p className="pb-2 text-xs text-muted-foreground">
            Date range applies to each report's primary date field. For finer filters (court, status, role…), use the
            Export button on the corresponding module page — it honours the active filters.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {visible.map((report) => <ReportCard key={report.key} report={report} range={range} />)}
        </div>

        <p className="text-xs text-muted-foreground">
          Exports run synchronously and are capped at 10–20k rows. Background export jobs with progress, retry and
          download history, plus XLSX/PDF formats, require a job queue that is not part of the backend yet. Reminder
          delivery and cause-list sync reports are available on the Hearings and Courts pages respectively.
        </p>
      </div>
    </PermissionGuard>
  )
}
