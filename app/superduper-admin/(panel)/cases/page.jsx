"use client"

import { Suspense } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/admin/shared/page-header"
import { FilterBar } from "@/components/admin/shared/filter-bar"
import { DataTable } from "@/components/admin/shared/data-table"
import { StatusBadge } from "@/components/admin/shared/status-badge"
import { ExportButton } from "@/components/admin/shared/export-button"
import { PermissionGuard } from "@/components/admin/shared/permission-guard"
import { Skeleton } from "@/components/ui/skeleton"
import { useServerTable } from "@/hooks/use-admin-table"
import { formatDateTime, titleCase } from "@/lib/admin/format"

const CASE_TYPES = ["civil", "criminal", "family", "commercial", "consumer", "labour", "tribunal", "special", "writ", "arbitration", "revenue", "motor_accident", "appeal", "revision", "execution", "other"]

const COLUMNS = [
  { key: "title", label: "Case", sortable: true, render: (c) => (
    <div className="max-w-[280px]">
      <p className="truncate font-medium">{c.title}</p>
      <p className="text-xs text-muted-foreground">{c.caseNumber}{c.cnrNumber ? ` · ${c.cnrNumber}` : ""}</p>
    </div>
  )},
  { key: "caseType", label: "Type", render: (c) => titleCase(c.caseType) },
  { key: "status", label: "Status", sortable: true, render: (c) => <StatusBadge status={c.status} /> },
  { key: "priority", label: "Priority", sortable: true, render: (c) => <StatusBadge status={c.priority} /> },
  { key: "courtState", label: "State / District", render: (c) => [c.courtState, c.district].filter(Boolean).map(titleCase).join(" / ") || "—" },
  { key: "createdBy", label: "Owner", render: (c) => c.createdBy?.email || "—" },
  { key: "updatedAt", label: "Updated", sortable: true, render: (c) => formatDateTime(c.updatedAt) },
]

function CasesContent() {
  const router = useRouter()
  const table = useServerTable({ endpoint: "/admin/cases", defaultSort: "-updatedAt" })

  return (
    <div className="space-y-4">
      <PageHeader title="Cases" description="Full registry of every case on the platform">
        <ExportButton endpoint="/admin/cases/export" filename="cases-export.csv" filters={table.filters} permission="cases.view" />
      </PageHeader>

      <FilterBar
        table={table}
        searchPlaceholder="Search title, case number or CNR…"
        dateRange
        selects={[
          { key: "status", label: "Status", options: ["active", "pending", "closed", "disposed"] },
          { key: "caseType", label: "Type", options: CASE_TYPES },
          { key: "priority", label: "Priority", options: ["low", "normal", "high", "urgent"] },
          { key: "courtType", label: "Court", options: ["supreme_court", "high_court", "district_court", "tribunal"] },
          { key: "unassigned", label: "Assignment", options: [{ value: "true", label: "Unassigned only" }] },
        ]}
      />

      <DataTable
        columns={COLUMNS}
        table={table}
        onRowClick={(c) => router.push(`/superduper-admin/cases/${c._id}`)}
        emptyTitle="No cases match these filters"
      />
    </div>
  )
}

export default function CasesPage() {
  return (
    <PermissionGuard permission="cases.view" showDenied>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <CasesContent />
      </Suspense>
    </PermissionGuard>
  )
}
