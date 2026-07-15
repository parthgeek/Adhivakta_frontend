"use client"

import { Suspense, useState } from "react"
import { PageHeader } from "@/components/admin/shared/page-header"
import { FilterBar } from "@/components/admin/shared/filter-bar"
import { DataTable } from "@/components/admin/shared/data-table"
import { StatusBadge } from "@/components/admin/shared/status-badge"
import { ExportButton } from "@/components/admin/shared/export-button"
import { PermissionGuard } from "@/components/admin/shared/permission-guard"
import { DetailDrawer, DetailRow } from "@/components/admin/shared/detail-drawer"
import { Skeleton } from "@/components/ui/skeleton"
import { useServerTable } from "@/hooks/use-admin-table"
import { formatDateTime, titleCase } from "@/lib/admin/format"

const MODULES = ["auth", "users", "cases", "documents", "hearings", "courts", "chat", "ai", "billing", "reports", "settings", "security"]

function JsonBlock({ value }) {
  if (!value || Object.keys(value).length === 0) return <span className="text-muted-foreground">—</span>
  return (
    <pre className="max-h-48 overflow-auto rounded-md bg-muted p-2 text-xs font-mono whitespace-pre-wrap break-all">
      {JSON.stringify(value, null, 2)}
    </pre>
  )
}

function SecurityContent() {
  const table = useServerTable({ endpoint: "/admin/audit", pageSize: 50 })
  const [detail, setDetail] = useState(null)

  const columns = [
    { key: "createdAt", label: "Timestamp", render: (e) => <span className="tabular-nums text-xs">{formatDateTime(e.createdAt)}</span> },
    { key: "actorEmail", label: "Actor", render: (e) => (
      <div>
        <p className="text-sm">{e.actorEmail || "system"}</p>
        <p className="text-xs text-muted-foreground">{titleCase(e.actorRole || "")}</p>
      </div>
    )},
    { key: "action", label: "Action", render: (e) => <span className="font-mono text-xs">{e.action}</span> },
    { key: "module", label: "Module", render: (e) => titleCase(e.module) },
    { key: "targetLabel", label: "Target", render: (e) => <span className="max-w-[200px] truncate block">{e.targetLabel || e.targetId || "—"}</span> },
    { key: "status", label: "Result", render: (e) => <StatusBadge status={e.status} /> },
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        title="Security & Audit Logs"
        description="Append-only trail of logins, admin actions, permission changes and exports"
      >
        <ExportButton endpoint="/admin/audit/export" filename="audit-export.csv" filters={table.filters} permission="audit.export" />
      </PageHeader>

      <FilterBar
        table={table}
        searchPlaceholder="Search actor, action, target or reason…"
        dateRange
        selects={[
          { key: "module", label: "Module", options: MODULES },
          { key: "status", label: "Result", options: ["success", "failure", "denied"] },
        ]}
      />

      <DataTable columns={columns} table={table} onRowClick={setDetail} emptyTitle="No audit events match these filters" />

      <DetailDrawer
        open={!!detail}
        onOpenChange={(open) => !open && setDetail(null)}
        title={detail?.action}
        description="Sensitive fields are redacted at write time; audit records cannot be edited or deleted"
      >
        {detail ? (
          <>
            <div>
              <DetailRow label="Timestamp">{formatDateTime(detail.createdAt)}</DetailRow>
              <DetailRow label="Actor">{detail.actorEmail || "system"} ({titleCase(detail.actorRole || "n/a")})</DetailRow>
              <DetailRow label="Module">{titleCase(detail.module)}</DetailRow>
              <DetailRow label="Target">{detail.targetLabel || "—"}</DetailRow>
              <DetailRow label="Target ID"><span className="font-mono text-xs">{detail.targetId || "—"}</span></DetailRow>
              <DetailRow label="Result"><StatusBadge status={detail.status} /></DetailRow>
              <DetailRow label="Reason">{detail.reason || "—"}</DetailRow>
              <DetailRow label="IP">{detail.ip || "—"}</DetailRow>
              <DetailRow label="User agent"><span className="text-xs">{detail.userAgent || "—"}</span></DetailRow>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Before</h3>
              <JsonBlock value={detail.before} />
              <h3 className="text-sm font-medium">After</h3>
              <JsonBlock value={detail.after} />
            </div>
          </>
        ) : null}
      </DetailDrawer>
    </div>
  )
}

export default function SecurityPage() {
  return (
    <PermissionGuard permission="audit.view" showDenied>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <SecurityContent />
      </Suspense>
    </PermissionGuard>
  )
}
